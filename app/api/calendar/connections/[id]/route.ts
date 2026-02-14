/**
 * Individual Calendar Connection API Routes
 *
 * PUT - Update a calendar connection
 * DELETE - Delete a calendar connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'

export async function PUT(
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
    const body = await request.json()
    const connection = await calendarService.updateConnection(params.id, body)
    return NextResponse.json(connection)
  } catch (error: any) {
    console.error('Failed to update connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    await calendarService.deleteConnection(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
