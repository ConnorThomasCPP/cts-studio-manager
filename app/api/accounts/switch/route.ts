import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = await request.json()
    if (!accountId) {
      return NextResponse.json({ error: 'Missing required field: accountId' }, { status: 400 })
    }

    const accountContext = await resolveAccountContext(supabase, user.id, accountId)
    if (!accountContext || accountContext.currentAccountId !== accountId) {
      return NextResponse.json({ error: 'Account access denied' }, { status: 403 })
    }

    if (accountContext.isLegacy) {
      return NextResponse.json(
        { error: 'Account switching unavailable until latest migrations are applied' },
        { status: 409 }
      )
    }

    const response = NextResponse.json({
      success: true,
      currentAccountId: accountContext.currentAccountId,
    })

    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ active_account_id: accountId })
      .eq('id', user.id)
    if (updateError) {
      throw updateError
    }

    response.cookies.set(ACTIVE_ACCOUNT_COOKIE, accountId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  } catch (error: any) {
    console.error('Failed to switch account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to switch account' },
      { status: 500 }
    )
  }
}
