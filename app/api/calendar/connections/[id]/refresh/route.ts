/**
 * Refresh Calendar Connection Token API Route
 *
 * POST - Refresh access token for a calendar connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const calendarService = new CalendarService(supabase)
    const connection = await calendarService.refreshAccessToken(params.id)
    return NextResponse.json(connection)
  } catch (error: any) {
    console.error('Failed to refresh token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
