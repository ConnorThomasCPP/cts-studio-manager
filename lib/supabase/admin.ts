/**
 * Supabase Admin Client - Server Side Only
 *
 * Uses the service role key to bypass RLS policies.
 * Only use this in API routes for admin operations like:
 * - Creating/deleting auth users
 * - Fetching user emails from auth.users
 * - Operations that need to bypass row-level security
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
