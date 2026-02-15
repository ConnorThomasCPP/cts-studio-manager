/**
 * Users API Route
 *
 * GET  - List all users in current account (members only)
 * POST - Invite/add a user to the current account (account admins only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

type AuthUserSummary = {
  id: string
  email?: string
  last_sign_in_at?: string | null
}

async function getCallerRole(supabase: any, userId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role || null
}

async function getAuthUsersMap() {
  const adminClient = createAdminClient()
  const authUsers: AuthUserSummary[] = []
  const perPage = 200
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) throw error

    const batch = (data?.users || []) as AuthUserSummary[]
    authUsers.push(...batch)
    hasMore = batch.length === perPage
    page += 1
  }

  const emailMap = new Map<string, { email: string; last_sign_in_at: string | null }>()
  for (const authUser of authUsers) {
    emailMap.set(authUser.id, {
      email: authUser.email || '',
      last_sign_in_at: authUser.last_sign_in_at || null,
    })
  }

  return { authUsers, emailMap }
}

function isValidRole(role: string): role is 'admin' | 'engineer' | 'viewer' {
  return ['admin', 'engineer', 'viewer'].includes(role)
}

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

    // Legacy schema fallback.
    if (accountContext.isLegacy) {
      const role = await getCallerRole(supabase, user.id)
      if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }

      const { data: users, error } = await (supabase as any)
        .from('users')
        .select('id, name, role, first_name, last_name, photo_url, created_at, updated_at')
        .order('name', { ascending: true })

      if (error) throw error

      const { emailMap } = await getAuthUsersMap()
      const usersWithEmail = (users || []).map((u: any) => {
        const authData = emailMap.get(u.id)
        return {
          ...u,
          email: authData?.email || '',
          last_sign_in_at: authData?.last_sign_in_at || null,
          status: 'active' as const,
        }
      })

      return NextResponse.json(usersWithEmail)
    }

    const { data: memberships, error } = await (supabase as any)
      .from('account_memberships')
      .select(`
        user_id,
        role,
        users(
          id,
          name,
          first_name,
          last_name,
          photo_url,
          created_at,
          updated_at
        )
      `)
      .eq('account_id', accountContext.currentAccountId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) throw error

    const { emailMap } = await getAuthUsersMap()

    const usersWithEmail = (memberships || []).map((m: any) => {
      const profile = Array.isArray(m.users) ? m.users[0] : m.users
      const authData = emailMap.get(m.user_id)

      return {
        id: profile?.id || m.user_id,
        name: profile?.name || '',
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        photo_url: profile?.photo_url || null,
        created_at: profile?.created_at || null,
        updated_at: profile?.updated_at || null,
        role: m.role,
        email: authData?.email || '',
        last_sign_in_at: authData?.last_sign_in_at || null,
        status: 'active' as const,
      }
    })

    return NextResponse.json(usersWithEmail)
  } catch (error: any) {
    console.error('Failed to get users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get users' },
      { status: 500 }
    )
  }
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

    const preferredAccountId = request.cookies.get(ACTIVE_ACCOUNT_COOKIE)?.value
    const accountContext = await resolveAccountContext(supabase, user.id, preferredAccountId)
    if (!accountContext) {
      return NextResponse.json({ error: 'No active account found' }, { status: 403 })
    }

    // Legacy schema fallback.
    if (accountContext.isLegacy) {
      const role = await getCallerRole(supabase, user.id)
      if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }

      const { email, role: newUserRole } = await request.json()
      const normalizedEmail = String(email || '').trim().toLowerCase()

      if (!normalizedEmail || !newUserRole) {
        return NextResponse.json(
          { error: 'Missing required fields: email, role' },
          { status: 400 }
        )
      }

      if (!isValidRole(newUserRole)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, engineer, or viewer' },
          { status: 400 }
        )
      }

      const adminClient = createAdminClient()
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=invite`
      const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(
        normalizedEmail,
        { redirectTo }
      )

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to invite user')

      const { data: profile, error: profileError } = await (adminClient as any)
        .from('users')
        .insert({
          id: authData.user.id,
          name: normalizedEmail.split('@')[0],
          role: newUserRole,
        })
        .select()
        .single()

      if (profileError) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      return NextResponse.json({
        ...profile,
        email: normalizedEmail,
        last_sign_in_at: null,
        status: 'active',
      }, { status: 201 })
    }

    if (accountContext.currentRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { email, role } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role' },
        { status: 400 }
      )
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, engineer, or viewer' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { authUsers, emailMap } = await getAuthUsersMap()
    const existingAuthUser = authUsers.find(
      (au) => (au.email || '').toLowerCase() === normalizedEmail
    )

    let targetUserId: string

    if (existingAuthUser) {
      targetUserId = existingAuthUser.id
    } else {
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=invite`

      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        normalizedEmail,
        { redirectTo }
      )

      if (inviteError) throw inviteError
      if (!inviteData.user) {
        throw new Error('Failed to invite user')
      }

      targetUserId = inviteData.user.id
    }

    // Ensure global profile exists (users table still required by legacy schema)
    const { data: existingProfile } = await (adminClient as any)
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle()

    if (!existingProfile) {
      const { error: profileError } = await (adminClient as any).from('users').insert({
        id: targetUserId,
        name: normalizedEmail.split('@')[0],
        role: 'viewer',
      })

      if (profileError) throw profileError
    }

    const { data: membership, error: membershipError } = await (adminClient as any)
      .from('account_memberships')
      .insert({
        account_id: accountContext.currentAccountId,
        user_id: targetUserId,
        role,
        status: 'active',
      })
      .select('user_id, role')
      .single()

    if (membershipError) {
      if (membershipError.code === '23505') {
        return NextResponse.json(
          { error: 'This user is already a member of this account' },
          { status: 409 }
        )
      }
      throw membershipError
    }

    const authData = emailMap.get(targetUserId)

    return NextResponse.json({
      id: membership.user_id,
      email: authData?.email || normalizedEmail,
      role: membership.role,
      last_sign_in_at: authData?.last_sign_in_at || null,
      status: 'active',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to invite/add user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add user' },
      { status: 500 }
    )
  }
}
