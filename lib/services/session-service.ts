import { createClient } from '@/lib/supabase/client'
import type { Session, SessionInsert, SessionUpdate } from '@/types/enhanced'

export class SessionService {
  private supabase = createClient()

  /**
   * Get all sessions
   */
  async getSessions() {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        projects(id, name, clients(name))
      `)
      .order('start_time', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get a single session by ID
   */
  async getSession(id: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        projects(id, name, clients(id, name)),
        created_by_user:users!sessions_created_by_fkey(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get sessions by project
   */
  async getSessionsByProject(projectId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('start_time', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Create a new session
   */
  async createSession(session: SessionInsert) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        ...session,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an existing session
   */
  async updateSession(id: string, updates: SessionUpdate) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string) {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const sessionService = new SessionService()
