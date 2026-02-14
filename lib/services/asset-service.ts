/**
 * Asset Service
 *
 * Business logic for asset management operations
 */

import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetInsert, AssetUpdate } from '@/types/enhanced'

export class AssetService {
  private supabase = createClient()

  /**
   * Get all assets with optional filtering
   */
  async getAssets(filters?: {
    status?: string
    category?: string
    search?: string
  }) {
    let query = this.supabase
      .from('assets')
      .select(`
        *,
        categories(id, name, color),
        locations!assets_home_location_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Get a single asset by ID
   */
  async getAsset(id: string) {
    const { data, error } = await this.supabase
      .from('assets')
      .select(`
        *,
        categories(id, name, color),
        locations!assets_home_location_id_fkey(id, name),
        current_location:locations!assets_current_location_id_fkey(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get asset by barcode
   */
  async getAssetByCode(assetCode: string) {
    const { data, error } = await this.supabase
      .from('assets')
      .select(`
        *,
        categories(id, name, color),
        locations!assets_home_location_id_fkey(id, name)
      `)
      .eq('asset_code', assetCode)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new asset
   */
  async createAsset(asset: AssetInsert) {
    const { data, error } = await this.supabase
      .from('assets')
      .insert(asset)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an asset
   */
  async updateAsset(id: string, updates: AssetUpdate) {
    const { data, error } = await this.supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete an asset
   */
  async deleteAsset(id: string) {
    const { error } = await this.supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Generate a unique asset code
   */
  async generateAssetCode(categoryName?: string) {
    const { data, error } = await this.supabase
      .rpc('generate_asset_code', { p_category_name: categoryName })

    if (error) throw error
    return data as string
  }

  /**
   * Get asset transaction history
   */
  async getAssetHistory(assetId: string, limit = 50) {
    const { data, error } = await this.supabase
      .rpc('get_asset_history', { p_asset_id: assetId, p_limit: limit })

    if (error) throw error
    return data
  }

  /**
   * Upload asset photo to Supabase Storage
   */
  async uploadPhoto(file: File, assetCode: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${assetCode}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await this.supabase.storage
      .from('asset-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from('asset-photos').getPublicUrl(filePath)

    return publicUrl
  }

  /**
   * Delete asset photo from storage
   */
  async deletePhoto(photoUrl: string) {
    // Extract file path from URL
    const urlParts = photoUrl.split('/asset-photos/')
    if (urlParts.length < 2) return

    const filePath = urlParts[1]

    const { error } = await this.supabase.storage
      .from('asset-photos')
      .remove([filePath])

    if (error) throw error
  }
}

// Singleton instance
export const assetService = new AssetService()
