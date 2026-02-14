/**
 * Enhanced Database Types
 *
 * These types are built on top of auto-generated Supabase types from
 * lib/supabase/database.types.ts
 *
 * Why we need enhanced types:
 * - Supabase's type generator creates loose types (e.g., `type: string | null`)
 *   because it doesn't capture CHECK constraints or enum-like patterns
 * - We enhance them here with stricter union types that match our actual
 *   database constraints for better type safety
 *
 * Workflow:
 * 1. Database schema changes in Supabase
 * 2. Run: npm run gen:types (regenerates lib/supabase/database.types.ts)
 * 3. Update these enhanced types if needed to reflect schema changes
 * 4. App code uses these enhanced types for better type checking
 */

import type { Database } from '@/lib/supabase/database.types'

// =============================================================================
// BASE TABLE TYPES (direct from auto-generated types)
// =============================================================================

export type User = Database['public']['Tables']['users']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionAsset = Database['public']['Tables']['session_assets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type AssetInsert = Database['public']['Tables']['assets']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionAssetInsert = Database['public']['Tables']['session_assets']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type SettingInsert = Database['public']['Tables']['settings']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type AssetUpdate = Database['public']['Tables']['assets']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']
export type SessionAssetUpdate = Database['public']['Tables']['session_assets']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
export type SettingUpdate = Database['public']['Tables']['settings']['Update']

// =============================================================================
// ENHANCED STEM PLAYER TYPES (with stricter union types)
// =============================================================================

// Stem type enum (matches database CHECK constraint)
export type StemType = 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other'

// Project status enum (matches database CHECK constraint)
export type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'archived'

// Base types from auto-generated
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Project = Omit<Database['public']['Tables']['projects']['Row'], 'status'> & {
  status: ProjectStatus
}
export type ProjectInsert = Omit<Database['public']['Tables']['projects']['Insert'], 'status'> & {
  status?: ProjectStatus
}
export type ProjectUpdate = Omit<Database['public']['Tables']['projects']['Update'], 'status'> & {
  status?: ProjectStatus
}

export type Track = Database['public']['Tables']['tracks']['Row']
export type TrackInsert = Database['public']['Tables']['tracks']['Insert']
export type TrackUpdate = Database['public']['Tables']['tracks']['Update']

// Enhanced Stem type with strict type field
export type Stem = Omit<Database['public']['Tables']['stems']['Row'], 'type'> & {
  type: StemType | null
}
export type StemInsert = Omit<Database['public']['Tables']['stems']['Insert'], 'type'> & {
  type?: StemType | null
}
export type StemUpdate = Omit<Database['public']['Tables']['stems']['Update'], 'type'> & {
  type?: StemType | null
}

export type StemComment = Database['public']['Tables']['stem_comments']['Row']
export type StemCommentInsert = Database['public']['Tables']['stem_comments']['Insert']
export type StemCommentUpdate = Database['public']['Tables']['stem_comments']['Update']

// =============================================================================
// WAVEFORM DATA TYPE
// =============================================================================

export interface WaveformData {
  peaks: number[]
}

// =============================================================================
// RE-EXPORT DATABASE TYPE FOR DIRECT ACCESS IF NEEDED
// =============================================================================

export type { Database }
