/**
 * Auth Callback Route
 *
 * Handles Supabase auth redirects (magic links, invite links, password resets).
 * Exchanges the auth code for a session, then redirects to the appropriate page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('redirect') || searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For invite and recovery flows, redirect to set-password page
      const type = searchParams.get('type')
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(new URL('/set-password', origin))
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // If no code or exchange failed, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}
