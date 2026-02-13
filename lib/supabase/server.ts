/**
 * Supabase Client - Server Side
 *
 * This client is used in Server Components, Server Actions, and API Routes.
 * It reads auth state from cookies for server-side rendering.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current user from server-side context
 */
export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current user's profile (with role)
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.role === 'admin'
}

/**
 * Check if the current user is an admin or engineer
 */
export async function canManageAssets(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.role === 'admin' || profile?.role === 'engineer'
}
