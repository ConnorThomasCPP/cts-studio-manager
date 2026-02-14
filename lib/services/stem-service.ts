import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Stem = Database['public']['Tables']['stems']['Row']
type StemInsert = Database['public']['Tables']['stems']['Insert']
type StemUpdate = Database['public']['Tables']['stems']['Update']
type StemComment = Database['public']['Tables']['stem_comments']['Row']
type StemCommentInsert = Database['public']['Tables']['stem_comments']['Insert']

export class StemService {
  private supabase = createClient()

  /**
   * Upload stem audio file to Supabase Storage
   */
  async uploadStemFile(
    file: File,
    projectId: string,
    trackId: string,
    stemId: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${stemId}.${fileExt}`
    const filePath = `${projectId}/${trackId}/${fileName}`

    const { data, error } = await this.supabase.storage
      .from('audio-stems')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('audio-stems')
      .getPublicUrl(filePath)

    return publicUrl
  }

  /**
   * Generate waveform data for a stem using Web Audio API
   * Returns pre-computed peaks for fast rendering
   */
  async generateWaveformData(file: File, sampleCount = 1000): Promise<{ peaks: number[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

          // Extract peaks from audio buffer
          const peaks = this.extractPeaks(audioBuffer, sampleCount)

          resolve({ peaks })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Extract peak values from audio buffer
   * @private
   */
  private extractPeaks(buffer: AudioBuffer, samples: number): number[] {
    const channelData = buffer.getChannelData(0) // Use first channel (mono or left)
    const blockSize = Math.floor(channelData.length / samples)
    const peaks: number[] = []

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      const end = start + blockSize
      let max = 0

      for (let j = start; j < end && j < channelData.length; j++) {
        max = Math.max(max, Math.abs(channelData[j]))
      }

      peaks.push(max)
    }

    return peaks
  }

  /**
   * Get audio file duration
   */
  async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const objectUrl = URL.createObjectURL(file)

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl)
        resolve(audio.duration)
      })

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load audio file'))
      })

      audio.src = objectUrl
    })
  }

  /**
   * Create a new stem with file upload
   */
  async createStem(
    projectId: string,
    trackId: string,
    name: string,
    type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other',
    file: File,
    color?: string
  ): Promise<Stem> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Generate temporary ID for file upload
    const tempId = crypto.randomUUID()

    // Upload file
    const fileUrl = await this.uploadStemFile(file, projectId, trackId, tempId)

    // Generate waveform data
    const waveformData = await this.generateWaveformData(file)

    // Get audio duration
    const duration = await this.getAudioDuration(file)

    // Get next sort order
    const { data: existingStems } = await this.supabase
      .from('stems')
      .select('sort_order')
      .eq('track_id', trackId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existingStems && existingStems.length > 0
      ? (existingStems[0].sort_order || 0) + 1
      : 0

    // Create database record
    const { data, error } = await this.supabase
      .from('stems')
      .insert({
        track_id: trackId,
        name,
        type,
        color: color || this.getDefaultColor(type),
        icon: this.getDefaultIcon(type),
        file_path: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        duration,
        waveform_data: waveformData,
        sort_order: nextSortOrder,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data as Stem
  }

  /**
   * Get default color for stem type
   * @private
   */
  private getDefaultColor(type: string): string {
    const colorMap: Record<string, string> = {
      vocals: '#f6bbd6',
      drums: '#348c32',
      bass: '#d4573b',
      guitar: '#f8a01c',
      keys: '#8b5cf6',
      synth: '#06b6d4',
      fx: '#a78bfa',
      other: '#94a3b8'
    }
    return colorMap[type] || '#94a3b8'
  }

  /**
   * Get default icon for stem type
   * @private
   */
  private getDefaultIcon(type: string): string {
    const iconMap: Record<string, string> = {
      vocals: 'mic',
      drums: 'circle',
      bass: 'waves',
      guitar: 'music2',
      keys: 'music3',
      synth: 'audio-waveform',
      fx: 'sparkles',
      other: 'music'
    }
    return iconMap[type] || 'music'
  }

  /**
   * Get all stems for a track
   */
  async getTrackStems(trackId: string) {
    const { data, error } = await this.supabase
      .from('stems')
      .select('*')
      .eq('track_id', trackId)
      .order('sort_order')

    if (error) throw error
    return data
  }

  /**
   * Get stems with comment counts using database function
   */
  async getTrackStemsWithComments(trackId: string) {
    const { data, error } = await this.supabase
      .rpc('get_track_stems_with_comments', {
        track_uuid: trackId
      })

    if (error) throw error
    return data
  }

  /**
   * Update stem
   */
  async updateStem(id: string, updates: StemUpdate) {
    const { data, error } = await this.supabase
      .from('stems')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Stem
  }

  /**
   * Delete stem and its file
   */
  async deleteStem(stemId: string) {
    // Get stem details
    const { data: stem } = await this.supabase
      .from('stems')
      .select('file_path')
      .eq('id', stemId)
      .single()

    if (!stem) throw new Error('Stem not found')

    // Extract file path from URL
    const url = new URL(stem.file_path)
    const pathParts = url.pathname.split('/audio-stems/')
    if (pathParts.length === 2) {
      await this.supabase.storage
        .from('audio-stems')
        .remove([pathParts[1]])
    }

    // Delete database record (cascade will delete comments)
    const { error } = await this.supabase
      .from('stems')
      .delete()
      .eq('id', stemId)

    if (error) throw error
  }

  /**
   * Reorder stems
   */
  async reorderStems(stemIds: string[]) {
    const updates = stemIds.map((id, index) => ({
      id,
      sort_order: index
    }))

    // Update each stem's sort order
    for (const update of updates) {
      await this.updateStem(update.id, { sort_order: update.sort_order })
    }
  }

  /**
   * Get download URL for stem
   */
  async getDownloadUrl(stemId: string): Promise<string> {
    const { data: stem } = await this.supabase
      .from('stems')
      .select('file_path')
      .eq('id', stemId)
      .single()

    if (!stem) throw new Error('Stem not found')

    // Extract file path
    const url = new URL(stem.file_path)
    const pathParts = url.pathname.split('/audio-stems/')
    if (pathParts.length !== 2) {
      throw new Error('Invalid file path')
    }

    // Create signed URL
    const { data, error } = await this.supabase.storage
      .from('audio-stems')
      .createSignedUrl(pathParts[1], 3600) // 1 hour expiry

    if (error) throw error
    if (!data) throw new Error('Failed to create signed URL')

    // Increment download count
    await this.supabase.rpc('increment_stem_download', {
      stem_uuid: stemId
    })

    return data.signedUrl
  }

  // ============================================================================
  // COMMENT METHODS
  // ============================================================================

  /**
   * Get comments for a stem
   */
  async getStemComments(stemId: string) {
    const { data, error } = await this.supabase
      .from('stem_comments')
      .select(`
        *,
        users(id, name, photo_url)
      `)
      .eq('stem_id', stemId)
      .order('timestamp')

    if (error) throw error
    return data
  }

  /**
   * Create a comment on a stem
   */
  async createComment(comment: StemCommentInsert): Promise<StemComment> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('stem_comments')
      .insert({
        ...comment,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data as StemComment
  }

  /**
   * Update a comment
   */
  async updateComment(id: string, content: string): Promise<StemComment> {
    const { data, error } = await this.supabase
      .from('stem_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as StemComment
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string) {
    const { error } = await this.supabase
      .from('stem_comments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get all comments for a track (across all stems)
   */
  async getTrackComments(trackId: string) {
    const { data, error } = await this.supabase
      .from('stem_comments')
      .select(`
        *,
        users(id, name, photo_url),
        stems!inner(id, name, track_id)
      `)
      .eq('stems.track_id', trackId)
      .order('timestamp')

    if (error) throw error
    return data
  }
}

export const stemService = new StemService()
