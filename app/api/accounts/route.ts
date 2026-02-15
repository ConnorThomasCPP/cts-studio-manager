import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeAccountTheme } from '@/lib/account-themes'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferredAccountId = request.cookies.get(ACTIVE_ACCOUNT_COOKIE)?.value
    const accountContext = await resolveAccountContext(supabase, user.id, preferredAccountId)

    if (!accountContext) {
      return NextResponse.json({ error: 'No active account found' }, { status: 403 })
    }

    return NextResponse.json(accountContext)
  } catch (error: any) {
    console.error('Failed to get accounts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get accounts' },
      { status: 500 }
    )
  }
}

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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const maxAccountsRaw = process.env.MAX_ACCOUNTS_PER_USER?.trim()
    const maxAccounts = maxAccountsRaw ? Number.parseInt(maxAccountsRaw, 10) : null
    if (maxAccountsRaw && (!Number.isInteger(maxAccounts) || (maxAccounts ?? 0) < 1)) {
      return NextResponse.json(
        { error: 'Server misconfiguration: MAX_ACCOUNTS_PER_USER must be a positive integer' },
        { status: 500 }
      )
    }

    const { name, theme } = await request.json()
    const trimmedName = String(name || '').trim()
    if (!trimmedName) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }
    const selectedTheme = normalizeAccountTheme(theme)

    const adminClient = createAdminClient()
    if (maxAccounts) {
      const { count: accountCount, error: countError } = await (adminClient as any)
        .from('account_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (countError) throw countError

      if ((accountCount ?? 0) >= maxAccounts) {
        return NextResponse.json(
          {
            error: 'Account limit reached for your current plan',
            requiresUpgrade: true,
            maxAccounts,
          },
          { status: 402 }
        )
      }
    }

    const baseSlug = slugify(trimmedName) || 'workspace'
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`

    let accountInsert = await (adminClient as any)
      .from('accounts')
      .insert({
        name: trimmedName,
        slug,
        created_by: user.id,
        theme: selectedTheme,
      })
      .select('id, name, slug')
      .single()

    // Backward-compatible fallback when theme column is not yet migrated.
    if (accountInsert.error?.code === '42703') {
      accountInsert = await (adminClient as any)
        .from('accounts')
        .insert({
          name: trimmedName,
          slug,
          created_by: user.id,
        })
        .select('id, name, slug')
        .single()
    }

    const { data: account, error: accountError } = accountInsert

    if (accountError) {
      // Legacy schema where accounts table has not been migrated yet.
      if (accountError.code === '42P01') {
        return NextResponse.json(
          { error: 'Account creation unavailable until latest migrations are applied' },
          { status: 409 }
        )
      }
      throw accountError
    }

    const { error: memberError } = await (adminClient as any)
      .from('account_memberships')
      .insert({
        account_id: account.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
      })

    if (memberError) throw memberError

    const { error: activeAccountError } = await (adminClient as any)
      .from('users')
      .update({ active_account_id: account.id })
      .eq('id', user.id)
    if (activeAccountError) throw activeAccountError

    const response = NextResponse.json(account, { status: 201 })
    response.cookies.set(ACTIVE_ACCOUNT_COOKIE, account.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  } catch (error: any) {
    console.error('Failed to create account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
