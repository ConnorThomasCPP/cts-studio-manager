import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeAccountTheme } from '@/lib/account-themes'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export async function POST(request: NextRequest) {
  try {
    const { name, accountName, email, password, theme } = await request.json()

    const trimmedName = String(name || '').trim()
    const trimmedAccountName = String(accountName || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '')
    const selectedTheme = normalizeAccountTheme(theme)

    if (!trimmedName || !trimmedAccountName || !normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: name, accountName, email, password' },
        { status: 400 }
      )
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: {
        name: trimmedName,
      },
    })

    if (createUserError) {
      const msg = createUserError.message || 'Failed to create user'
      if (msg.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      )
    }

    const userId = createdUserData.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Ensure user profile exists.
    const { error: profileError } = await (adminClient as any)
      .from('users')
      .upsert({
        id: userId,
        name: trimmedName,
        role: 'admin',
      }, { onConflict: 'id' })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId)
      throw profileError
    }

    const baseSlug = slugify(trimmedAccountName) || 'workspace'
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`

    let accountInsert = await (adminClient as any)
      .from('accounts')
      .insert({
        name: trimmedAccountName,
        slug,
        created_by: userId,
        theme: selectedTheme,
      })
      .select('id, name, slug')
      .single()

    // Backward-compatible fallback when theme column is not yet migrated.
    if (accountInsert.error?.code === '42703') {
      accountInsert = await (adminClient as any)
        .from('accounts')
        .insert({
          name: trimmedAccountName,
          slug,
          created_by: userId,
        })
        .select('id, name, slug')
        .single()
    }

    const { data: account, error: accountError } = accountInsert

    if (accountError) {
      await (adminClient as any).from('users').delete().eq('id', userId)
      await adminClient.auth.admin.deleteUser(userId)
      if (accountError.code === '42P01') {
        return NextResponse.json(
          { error: 'Account tables are not available yet. Apply latest migrations first.' },
          { status: 409 }
        )
      }
      throw accountError
    }

    const { error: membershipError } = await (adminClient as any)
      .from('account_memberships')
      .insert({
        account_id: account.id,
        user_id: userId,
        role: 'admin',
        status: 'active',
      })

    if (membershipError) throw membershipError

    // Best effort: active account column might not exist yet.
    const { error: activeAccountError } = await (adminClient as any)
      .from('users')
      .update({ active_account_id: account.id })
      .eq('id', userId)
    if (activeAccountError && activeAccountError.code !== '42703') {
      throw activeAccountError
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      account,
      userId,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to sign up account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
