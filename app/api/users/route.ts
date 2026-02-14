/**
 * Users API Route
 *
 * GET - List all users (for attendee selection, team views, etc.)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get users from the users table
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role')
      .order('name', { ascending: true })

    if (error) throw error

    // Get email addresses from auth.users
    const usersWithEmail = await Promise.all(
      (users || []).map(async (user) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
        return {
          ...user,
          email: authUser?.user?.email || '',
        }
      })
    )

    return NextResponse.json(usersWithEmail)
  } catch (error: any) {
    console.error('Failed to get users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get users' },
      { status: 500 }
    )
  }
}
