import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Track = Database['public']['Tables']['tracks']['Row']
type TrackInsert = Database['public']['Tables']['tracks']['Insert']
type TrackUpdate = Database['public']['Tables']['tracks']['Update']

export class TrackService {
  private supabase = createClient()

  /**
   * Get all tracks
   */
  async getTracks() {
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        *,
        projects(
          id,
          name,
          clients(id, name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get a single track by ID
   */
  async getTrack(id: string) {
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        *,
        projects(
          id,
          name,
          clients(id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get track with stems and comments
   */
  async getTrackWithStems(id: string) {
    const { data, error } = await this.supabase
      .from('tracks')
      .select(`
        *,
        projects(
          id,
          name,
          clients(id, name)
        ),
        stems(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new track
   */
  async createTrack(track: TrackInsert) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('tracks')
      .insert({
        ...track,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an existing track
   */
  async updateTrack(id: string, updates: TrackUpdate) {
    const { data, error } = await this.supabase
      .from('tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a track
   */
  async deleteTrack(id: string) {
    const { error } = await this.supabase
      .from('tracks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get tracks by project
   */
  async getTracksByProject(projectId: string) {
    const { data, error } = await this.supabase
      .from('tracks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Update track duration based on stems
   * Call this after uploading stems
   */
  async updateTrackDuration(trackId: string) {
    // Get max duration from stems
    const { data: stems } = await this.supabase
      .from('stems')
      .select('duration')
      .eq('track_id', trackId)

    if (!stems || stems.length === 0) return

    const maxDuration = Math.max(...stems.map(s => s.duration || 0))

    await this.updateTrack(trackId, { duration: maxDuration })
  }
}

export const trackService = new TrackService()
