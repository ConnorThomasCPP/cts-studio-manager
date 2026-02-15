import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

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

    const adminClient = createAdminClient()
    const { data: profile, error } = await (adminClient as any)
      .from('users')
      .select('id, first_name, last_name, name, photo_url')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      id: user.id,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      name: profile?.name || user.email?.split('@')[0] || 'User',
      photo_url: profile?.photo_url || null,
      email: user.email || '',
      role: accountContext?.currentRole || 'viewer',
    })
  } catch (error: any) {
    console.error('Failed to get profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get profile' },
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

    const body = await request.json()
    const updates: Record<string, string | null> = {}

    if (Object.prototype.hasOwnProperty.call(body, 'first_name')) {
      updates.first_name = body.first_name ? String(body.first_name) : null
    }
    if (Object.prototype.hasOwnProperty.call(body, 'last_name')) {
      updates.last_name = body.last_name ? String(body.last_name) : null
    }
    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      updates.name = body.name ? String(body.name) : 'User'
    }
    if (Object.prototype.hasOwnProperty.call(body, 'photo_url')) {
      updates.photo_url = body.photo_url ? String(body.photo_url) : null
    }

    const adminClient = createAdminClient()
    const { data, error } = await (adminClient as any)
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, first_name, last_name, name, photo_url')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

