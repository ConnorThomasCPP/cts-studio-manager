/**
 * Users API Route
 *
 * GET  - List all users with emails (admin only)
 * POST - Invite a new user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCallerRole(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role || null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getCallerRole(supabase, user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get all users from public.users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role, first_name, last_name, photo_url, created_at, updated_at')
      .order('name', { ascending: true })

    if (error) throw error

    // Use admin client to fetch emails from auth.users (paginated)
    const adminClient = createAdminClient()
    const authUsers: Array<{ id: string; email?: string; last_sign_in_at?: string | null }> = []
    const perPage = 200
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authError) throw authError

      const batch = data?.users || []
      authUsers.push(...batch)

      hasMore = batch.length === perPage
      page += 1
    }

    // Build email lookup map
    const emailMap = new Map<string, { email: string; last_sign_in_at: string | null }>()
    for (const authUser of authUsers) {
      emailMap.set(authUser.id, {
        email: authUser.email || '',
        last_sign_in_at: authUser.last_sign_in_at || null,
      })
    }

    // Merge public.users with auth data
    const usersWithEmail = (users || []).map((u) => {
      const authData = emailMap.get(u.id)
      return {
        ...u,
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getCallerRole(supabase, user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { email, role: newUserRole } = await request.json()

    if (!email || !newUserRole) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role' },
        { status: 400 }
      )
    }

    if (!['admin', 'engineer', 'viewer'].includes(newUserRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, engineer, or viewer' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?type=invite`

    // Invite the user via email - sends an invite link they can click to set their password
    const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    )

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to invite user')
    }

    // Create the public.users profile using admin client (bypasses RLS)
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        name: email.split('@')[0],
        role: newUserRole,
      })
      .select()
      .single()

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return NextResponse.json({
      ...profile,
      email,
      last_sign_in_at: null,
      status: 'active',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to invite user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    )
  }
}
