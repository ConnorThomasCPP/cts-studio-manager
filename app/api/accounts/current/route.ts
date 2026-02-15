import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

const DELETE_CONFIRMATION_TEXT = 'DELETE ACCOUNT'
const ACCOUNT_THEMES = ['studio-default', 'neon-space-station', 'neon-daylight'] as const

export async function DELETE(request: NextRequest) {
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

    if (!accountContext || accountContext.isLegacy) {
      return NextResponse.json(
        { error: 'Account deletion unavailable until latest migrations are applied' },
        { status: 409 }
      )
    }

    if (accountContext.currentRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { confirmationText } = await request.json()
    if ((confirmationText || '').trim() !== DELETE_CONFIRMATION_TEXT) {
      return NextResponse.json(
        { error: `Confirmation text must match "${DELETE_CONFIRMATION_TEXT}"` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const deletedAccountId = accountContext.currentAccountId

    const { error: deleteError } = await (adminClient as any)
      .from('accounts')
      .delete()
      .eq('id', deletedAccountId)

    if (deleteError) throw deleteError

    const { data: remainingMemberships, error: membershipsError } = await (adminClient as any)
      .from('account_memberships')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (membershipsError) throw membershipsError

    const nextAccountId = remainingMemberships?.[0]?.account_id || null

    // Best effort: active_account_id may not exist in some legacy DB states.
    const { error: activeAccountError } = await (adminClient as any)
      .from('users')
      .update({ active_account_id: nextAccountId })
      .eq('id', user.id)
    if (activeAccountError && activeAccountError.code !== '42703') {
      throw activeAccountError
    }

    const response = NextResponse.json({
      success: true,
      nextAccountId,
      hasRemainingAccount: !!nextAccountId,
    })

    if (nextAccountId) {
      response.cookies.set(ACTIVE_ACCOUNT_COOKIE, nextAccountId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
      })
    } else {
      response.cookies.set(ACTIVE_ACCOUNT_COOKIE, '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
      })
    }

    return response
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    if (!accountContext || accountContext.isLegacy) {
      return NextResponse.json(
        { error: 'Account theme updates unavailable until latest migrations are applied' },
        { status: 409 }
      )
    }

    if (accountContext.currentRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { theme, name } = await request.json()
    const updatePayload: Record<string, string> = {}

    if (typeof name !== 'undefined') {
      const normalizedName = String(name || '').trim()
      if (!normalizedName) {
        return NextResponse.json(
          { error: 'Account name is required' },
          { status: 400 }
        )
      }
      if (normalizedName.length > 120) {
        return NextResponse.json(
          { error: 'Account name must be 120 characters or fewer' },
          { status: 400 }
        )
      }
      updatePayload.name = normalizedName
    }

    if (typeof theme !== 'undefined') {
      const normalizedTheme = String(theme || '').trim()
      if (!ACCOUNT_THEMES.includes(normalizedTheme as (typeof ACCOUNT_THEMES)[number])) {
        return NextResponse.json(
          { error: 'Invalid theme selection' },
          { status: 400 }
        )
      }
      updatePayload.theme = normalizedTheme
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No valid account updates supplied' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { error: updateError } = await (adminClient as any)
      .from('accounts')
      .update(updatePayload)
      .eq('id', accountContext.currentAccountId)

    if (updateError) {
      if (updateError.code === '42703') {
        return NextResponse.json(
          { error: 'Account theme column missing. Apply latest migrations first.' },
          { status: 409 }
        )
      }
      throw updateError
    }

    return NextResponse.json({
      success: true,
      theme: updatePayload.theme || accountContext.currentAccountTheme,
      name: updatePayload.name || accountContext.currentAccountName,
    })
  } catch (error: any) {
    console.error('Failed to update account theme:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update account theme' },
      { status: 500 }
    )
  }
}
