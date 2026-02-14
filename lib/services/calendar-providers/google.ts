/**
 * Google Calendar Provider
 *
 * Implements calendar operations using Google Calendar API
 */

import { google } from 'googleapis'
import type { CalendarProvider, CalendarEvent } from '../calendar-service'
import type { CalendarConnection } from '@/types/enhanced'

export class GoogleCalendarClient implements CalendarProvider {
  private oauth2Client: any
  private calendar: any

  constructor(private connection: CalendarConnection) {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/callback/google'
    )

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    })

    // Initialize Calendar API client
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * Get calendar events within a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: this.connection.calendar_id || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    return (
      response.data.items?.map((event: any) => ({
        id: event.id,
        summary: event.summary || 'Untitled Event',
        description: event.description,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        attendees: event.attendees?.map((a: any) => a.email) || [],
        location: event.location,
      })) || []
    )
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    const response = await this.calendar.events.insert({
      calendarId: this.connection.calendar_id || 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      },
      sendUpdates: 'all', // Send email invites to attendees
    })

    return response.data.id!
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    await this.calendar.events.patch({
      calendarId: this.connection.calendar_id || 'primary',
      eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start
          ? {
              dateTime: event.start.toISOString(),
              timeZone: 'UTC',
            }
          : undefined,
        end: event.end
          ? {
              dateTime: event.end.toISOString(),
              timeZone: 'UTC',
            }
          : undefined,
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
      },
      sendUpdates: 'all', // Notify attendees of changes
    })
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: this.connection.calendar_id || 'primary',
      eventId,
      sendUpdates: 'all', // Notify attendees of cancellation
    })
  }

  /**
   * Refresh the OAuth access token
   */
  async refreshToken(): Promise<{ access_token: string; expires_at: Date }> {
    const { credentials } = await this.oauth2Client.refreshAccessToken()

    return {
      access_token: credentials.access_token!,
      expires_at: new Date(credentials.expiry_date!),
    }
  }
}
