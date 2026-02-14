/**
 * Calendar Connections API Routes
 *
 * GET - List all calendar connections for the authenticated user
 * POST - Create a new calendar connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const calendarService = new CalendarService(supabase)
    const connections = await calendarService.getConnections()
    return NextResponse.json(connections)
  } catch (error: any) {
    console.error('Failed to get connections:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get connections' },
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

    const calendarService = new CalendarService(supabase)
    const body = await request.json()
    const connection = await calendarService.createConnection(body)
    return NextResponse.json(connection)
  } catch (error: any) {
    console.error('Failed to create connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create connection' },
      { status: 500 }
    )
  }
}
