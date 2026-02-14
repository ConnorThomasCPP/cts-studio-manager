import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectService {
  private supabase = createClient()

  /**
   * Get all projects
   */
  async getProjects() {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        clients(id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: 'planning' | 'active' | 'review' | 'completed' | 'archived') {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        clients(id, name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        clients(id, name, email, phone, company)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get project with tracks
   */
  async getProjectWithTracks(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        clients(id, name, email, phone, company),
        tracks(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new project
   */
  async createProject(project: ProjectInsert) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        ...project,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, updates: ProjectUpdate) {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string) {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get projects by client
   */
  async getProjectsByClient(clientId: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export const projectService = new ProjectService()
