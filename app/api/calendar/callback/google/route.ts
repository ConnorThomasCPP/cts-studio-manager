/**
 * Google Calendar OAuth Callback Handler
 *
 * Exchanges authorization code for tokens and saves connection to database
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/settings/calendar?error=${error || 'unknown'}`, request.url)
    )
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/callback/google'
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Get calendar list to find primary calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const { data: calendarList } = await calendar.calendarList.list()
    const primaryCalendar = calendarList.items?.find(cal => cal.primary)

    // Save connection to database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error: dbError } = await supabase.from('calendar_connections').upsert({
      user_id: user.id,
      provider: 'google',
      provider_account_id: userInfo.id!,
      provider_account_email: userInfo.email!,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      token_expires_at: new Date(tokens.expiry_date!).toISOString(),
      calendar_id: primaryCalendar?.id || 'primary',
      calendar_name: primaryCalendar?.summary || 'Primary Calendar',
      sync_enabled: true,
      auto_create_events: true,
    })

    if (dbError) throw dbError

    return NextResponse.redirect(
      new URL('/settings/calendar?success=google', request.url)
    )
  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings/calendar?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
