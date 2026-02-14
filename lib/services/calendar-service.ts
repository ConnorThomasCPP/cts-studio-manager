/**
 * Calendar Service
 *
 * Manages calendar connections and synchronization between sessions and external calendars
 * (Google Calendar, Outlook Calendar, etc.)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type {
  CalendarConnection,
  CalendarConnectionInsert,
  CalendarConnectionUpdate,
  CalendarSync,
  CalendarSyncInsert,
  CalendarSyncUpdate,
  Session,
  SessionAttendee,
  User,
} from '@/types/enhanced'

// Calendar event interface (provider-agnostic)
export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: Date
  end: Date
  attendees?: string[]
  location?: string
}

// Provider interface that all calendar providers must implement
export interface CalendarProvider {
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>
  createEvent(event: CalendarEvent): Promise<string>
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void>
  deleteEvent(eventId: string): Promise<void>
  refreshToken(): Promise<{ access_token: string; expires_at: Date }>
}

export class CalendarService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all calendar connections for the current user
   */
  async getConnections(): Promise<CalendarConnection[]> {
    const { data, error } = await this.supabase
      .from('calendar_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get a specific calendar connection by ID
   */
  async getConnection(id: string): Promise<CalendarConnection | null> {
    const { data, error } = await this.supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Create a new calendar connection (called after OAuth callback)
   */
  async createConnection(
    connection: CalendarConnectionInsert
  ): Promise<CalendarConnection> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('calendar_connections')
      .insert({
        ...connection,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a calendar connection (settings, preferences, etc.)
   */
  async updateConnection(
    id: string,
    updates: CalendarConnectionUpdate
  ): Promise<CalendarConnection> {
    const { data, error } = await this.supabase
      .from('calendar_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a calendar connection (and all associated syncs via cascade)
   */
  async deleteConnection(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('calendar_connections')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get calendar syncs for a specific session
   */
  async getSessionSyncs(sessionId: string): Promise<CalendarSync[]> {
    const { data, error } = await this.supabase
      .from('calendar_syncs')
      .select('*, calendar_connections(*)')
      .eq('session_id', sessionId)

    if (error) throw error
    return data || []
  }

  /**
   * Get attendees for a specific session
   */
  async getSessionAttendees(sessionId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('session_attendees')
      .select('*, users(*)')
      .eq('session_id', sessionId)
      .order('is_organizer', { ascending: false })

    if (error) throw error

    // Extract user objects from the joined data
    return data?.map((attendee: any) => attendee.users) || []
  }

  /**
   * Add attendees to a session
   */
  async addSessionAttendees(
    sessionId: string,
    userIds: string[],
    organizerId?: string
  ): Promise<void> {
    const attendees = userIds.map(userId => ({
      session_id: sessionId,
      user_id: userId,
      is_organizer: organizerId ? userId === organizerId : false,
    }))

    const { error } = await this.supabase
      .from('session_attendees')
      .insert(attendees)

    if (error) throw error
  }

  /**
   * Remove attendees from a session
   */
  async removeSessionAttendees(sessionId: string, userIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('session_attendees')
      .delete()
      .eq('session_id', sessionId)
      .in('user_id', userIds)

    if (error) throw error
  }

  /**
   * Sync a session to a calendar
   * This creates a calendar event and tracks the sync
   */
  async syncSessionToCalendar(
    sessionId: string,
    connectionId: string
  ): Promise<CalendarSync> {
    // Get session details
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError

    // Get connection details
    const connection = await this.getConnection(connectionId)
    if (!connection) throw new Error('Calendar connection not found')

    // Get session attendees
    const attendees = await this.getSessionAttendees(sessionId)
    const attendeeEmails = attendees.map(user => user.email).filter(Boolean) as string[]

    // Get the appropriate provider client
    const provider = await this.getProviderClient(connection)

    // Check if already synced
    const { data: existingSync } = await this.supabase
      .from('calendar_syncs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('connection_id', connectionId)
      .single()

    // Prepare calendar event
    const calendarEvent: CalendarEvent = {
      id: existingSync?.external_event_id || '',
      summary: session.session_name,
      description: this.formatSessionDescription(session),
      start: new Date(session.start_time),
      end: session.end_time ? new Date(session.end_time) : new Date(session.start_time),
      attendees: attendeeEmails,
      location: 'Studio',
    }

    try {
      if (existingSync) {
        // Update existing event
        await provider.updateEvent(existingSync.external_event_id, calendarEvent)

        // Update sync record
        const { data, error } = await this.supabase
          .from('calendar_syncs')
          .update({
            last_synced_at: new Date().toISOString(),
            session_updated_at: session.updated_at,
            sync_status: 'synced',
            sync_error: null,
          })
          .eq('id', existingSync.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new event
        const eventId = await provider.createEvent(calendarEvent)

        // Create sync record
        const { data, error } = await this.supabase
          .from('calendar_syncs')
          .insert({
            session_id: sessionId,
            connection_id: connectionId,
            external_event_id: eventId,
            external_calendar_id: connection.calendar_id || 'primary',
            last_synced_at: new Date().toISOString(),
            session_updated_at: session.updated_at,
            sync_status: 'synced',
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error: any) {
      // Mark sync as error
      if (existingSync) {
        await this.supabase
          .from('calendar_syncs')
          .update({
            sync_status: 'error',
            sync_error: error.message,
          })
          .eq('id', existingSync.id)
      }
      throw error
    }
  }

  /**
   * Remove a session from a calendar (delete the calendar event)
   */
  async unsyncSessionFromCalendar(syncId: string): Promise<void> {
    const { data: sync, error: syncError } = await this.supabase
      .from('calendar_syncs')
      .select('*, calendar_connections(*)')
      .eq('id', syncId)
      .single()

    if (syncError) throw syncError

    try {
      // Get provider client
      const provider = await this.getProviderClient(sync.calendar_connections as CalendarConnection)

      // Delete from calendar
      await provider.deleteEvent(sync.external_event_id)

      // Delete sync record
      const { error } = await this.supabase
        .from('calendar_syncs')
        .delete()
        .eq('id', syncId)

      if (error) throw error
    } catch (error: any) {
      // Even if calendar deletion fails, remove the sync record
      await this.supabase
        .from('calendar_syncs')
        .delete()
        .eq('id', syncId)

      throw error
    }
  }

  /**
   * Import calendar events as sessions
   */
  async importCalendarEvents(
    connectionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Session[]> {
    const connection = await this.getConnection(connectionId)
    if (!connection) throw new Error('Calendar connection not found')

    const provider = await this.getProviderClient(connection)
    const events = await provider.getEvents(startDate, endDate)

    // Filter out events that are already synced
    const { data: existingSyncs } = await this.supabase
      .from('calendar_syncs')
      .select('external_event_id')
      .eq('connection_id', connectionId)

    const existingEventIds = new Set(existingSyncs?.map(s => s.external_event_id) || [])
    const newEvents = events.filter(e => !existingEventIds.has(e.id))

    // Create sessions from calendar events
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const createdSessions: Session[] = []

    for (const event of newEvents) {
      try {
        // Create session
        const { data: session, error } = await this.supabase
          .from('sessions')
          .insert({
            session_name: event.summary,
            client_name: event.attendees?.[0] || 'Imported from Calendar',
            engineer: user.email || 'Unknown',
            start_time: event.start.toISOString(),
            end_time: event.end.toISOString(),
            status: 'planned',
            notes: event.description || `Imported from ${connection.provider} calendar`,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error

        // Create sync record
        await this.supabase
          .from('calendar_syncs')
          .insert({
            session_id: session.id,
            connection_id: connectionId,
            external_event_id: event.id,
            external_calendar_id: connection.calendar_id || 'primary',
            sync_status: 'synced',
          })

        createdSessions.push(session)
      } catch (error) {
        console.error(`Failed to import event ${event.id}:`, error)
      }
    }

    return createdSessions
  }

  /**
   * Refresh access token for a connection
   */
  async refreshAccessToken(connectionId: string): Promise<CalendarConnection> {
    const connection = await this.getConnection(connectionId)
    if (!connection) throw new Error('Calendar connection not found')

    const provider = await this.getProviderClient(connection)
    const { access_token, expires_at } = await provider.refreshToken()

    const { data, error } = await this.supabase
      .from('calendar_connections')
      .update({
        access_token,
        token_expires_at: expires_at.toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get the appropriate provider client for a connection
   */
  private async getProviderClient(connection: CalendarConnection): Promise<CalendarProvider> {
    // Import provider dynamically based on provider type
    switch (connection.provider) {
      case 'google': {
        const { GoogleCalendarClient } = await import('./calendar-providers/google')
        return new GoogleCalendarClient(connection)
      }
      case 'microsoft': {
        const { MicrosoftCalendarClient } = await import('./calendar-providers/microsoft')
        return new MicrosoftCalendarClient(connection)
      }
      case 'apple': {
        const { AppleCalendarClient } = await import('./calendar-providers/apple')
        return new AppleCalendarClient(connection)
      }
      default:
        throw new Error(`Unsupported calendar provider: ${connection.provider}`)
    }
  }

  /**
   * Format session data into a calendar event description
   */
  private formatSessionDescription(session: Session): string {
    const parts = [
      `Client: ${session.client_name}`,
      `Engineer: ${session.engineer}`,
    ]

    if (session.notes) {
      parts.push(`\n${session.notes}`)
    }

    parts.push('\n---')
    parts.push('Created with CTS Studio Manager')

    return parts.join('\n')
  }
}

// Note: CalendarService requires a Supabase client instance
// Import createClient from '@/lib/supabase/server' or '@/lib/supabase/client' depending on context
// Example: const service = new CalendarService(await createClient())
