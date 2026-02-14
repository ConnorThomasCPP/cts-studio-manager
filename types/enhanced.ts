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
// ENHANCED STUDIO WORKFLOW TYPES (with stricter union types)
// =============================================================================

// Stem type enum (matches database CHECK constraint)
export type StemType = 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other'

// Client type enum (matches database CHECK constraint)
export type ClientType = 'artist' | 'band' | 'label' | 'producer' | 'other'

// Project status enum (matches database CHECK constraint)
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'delivered' | 'archived'

// Project type enum (matches database CHECK constraint)
export type ProjectType = 'recording' | 'mixing' | 'mastering' | 'podcast' | 'film' | 'other'

// Storage policy enum (matches database CHECK constraint)
export type StoragePolicy = 'retain_30' | 'retain_90' | 'metadata_only'

// Rate model enum (matches database CHECK constraint)
export type RateModel = 'per_day' | 'per_track' | 'fixed_rate'

// Track status enum (matches database CHECK constraint)
export type TrackStatus = 'writing' | 'tracking' | 'editing' | 'mixing' | 'mastering' | 'delivered'

// Enhanced Client type with strict type field
export type Client = Omit<Database['public']['Tables']['clients']['Row'], 'type'> & {
  type: ClientType
}
export type ClientInsert = Omit<Database['public']['Tables']['clients']['Insert'], 'type'> & {
  type?: ClientType
}
export type ClientUpdate = Omit<Database['public']['Tables']['clients']['Update'], 'type'> & {
  type?: ClientType
}

// Enhanced Project type with strict status, project_type, storage_policy, and rate_model fields
export type Project = Omit<Database['public']['Tables']['projects']['Row'], 'status' | 'project_type' | 'storage_policy' | 'rate_model'> & {
  status: ProjectStatus
  project_type: ProjectType
  storage_policy: StoragePolicy
  rate_model: RateModel
}
export type ProjectInsert = Omit<Database['public']['Tables']['projects']['Insert'], 'status' | 'project_type' | 'storage_policy' | 'rate_model'> & {
  status?: ProjectStatus
  project_type?: ProjectType
  storage_policy?: StoragePolicy
  rate_model?: RateModel
}
export type ProjectUpdate = Omit<Database['public']['Tables']['projects']['Update'], 'status' | 'project_type' | 'storage_policy' | 'rate_model'> & {
  status?: ProjectStatus
  project_type?: ProjectType
  storage_policy?: StoragePolicy
  rate_model?: RateModel
}

// Enhanced Track type with strict status field
export type Track = Omit<Database['public']['Tables']['tracks']['Row'], 'status'> & {
  status: TrackStatus
}
export type TrackInsert = Omit<Database['public']['Tables']['tracks']['Insert'], 'status'> & {
  status?: TrackStatus
}
export type TrackUpdate = Omit<Database['public']['Tables']['tracks']['Update'], 'status'> & {
  status?: TrackStatus
}

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
