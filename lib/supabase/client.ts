/**
 * Supabase Client - Browser Side
 *
 * This client is used in Client Components and browser-side code.
 * It handles auth state management and database operations from the browser.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton instance for convenience
export const supabase = createClient()
