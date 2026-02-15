/**
 * Calendar Sync API Route
 *
 * POST - Sync a session to selected calendar connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, connectionIds, attendeeUserIds } = await request.json()

    if (!sessionId || !connectionIds || !Array.isArray(connectionIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, connectionIds' },
        { status: 400 }
      )
    }

    const calendarService = new CalendarService(supabase)
    const results = []

    // Sync to each selected calendar connection
    for (const connectionId of connectionIds) {
      try {
        const sync = await calendarService.syncSessionToCalendar(
          sessionId,
          connectionId
        )
        results.push({ connectionId, success: true, sync })
      } catch (error: any) {
        console.error(`Failed to sync to connection ${connectionId}:`, error)
        results.push({ connectionId, success: false, error: error.message })
      }
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Failed to sync session to calendars:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync session' },
      { status: 500 }
    )
  }
}
