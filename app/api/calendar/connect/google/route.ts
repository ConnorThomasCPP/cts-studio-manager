/**
 * Google Calendar OAuth Connection Initiator
 *
 * Redirects user to Google's OAuth consent screen
 */

import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/callback/google'
    )

    // Scopes required for calendar access
    // calendar.events: Read/write access to events only
    // calendar.readonly: Read calendar metadata (calendar names, list) - needed for callback
    // This does NOT allow modifying calendar settings, sharing, or deleting calendars
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    })

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL('/settings/calendar?error=' + encodeURIComponent(error.message), process.env.NEXT_PUBLIC_APP_URL!)
    )
  }
}
