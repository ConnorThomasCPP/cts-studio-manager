/**
 * User Detail API Route (account-scoped)
 *
 * PATCH  - Update a member's role in current account (admin only)
 * DELETE - Remove a member from current account (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

function isValidRole(role: string): role is 'admin' | 'engineer' | 'viewer' {
  return ['admin', 'engineer', 'viewer'].includes(role)
}

async function getCallerRole(supabase: any, userId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role || null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      const callerRole = await getCallerRole(supabase, user.id)
      if (callerRole !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }

      if (id === user.id) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400 }
        )
      }

      const { role: newRole } = await request.json()
      if (!newRole || !isValidRole(newRole)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, engineer, or viewer' },
          { status: 400 }
        )
      }

      const adminClient = createAdminClient()
      const { data, error } = await (adminClient as any)
        .from('users')
        .update({ role: newRole })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    if (accountContext.currentRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Prevent admin from changing their own role in this account
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const { role: newRole } = await request.json()

    if (!newRole || !isValidRole(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, engineer, or viewer' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data, error } = await (adminClient as any)
      .from('account_memberships')
      .update({ role: newRole })
      .eq('account_id', accountContext.currentAccountId)
      .eq('user_id', id)
      .eq('status', 'active')
      .select('account_id, user_id, role')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to update member role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update member role' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      const callerRole = await getCallerRole(supabase, user.id)
      if (callerRole !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }

      if (id === user.id) {
        return NextResponse.json(
          { error: 'Cannot remove yourself' },
          { status: 400 }
        )
      }

      const adminClient = createAdminClient()
      const { error } = await adminClient.auth.admin.deleteUser(id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (accountContext.currentRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Prevent admin from removing themselves from this account
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await (adminClient as any)
      .from('account_memberships')
      .delete()
      .eq('account_id', accountContext.currentAccountId)
      .eq('user_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 500 }
    )
  }
}
