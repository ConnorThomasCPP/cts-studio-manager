import { createClient } from '@/lib/supabase/client'
import type { Client, ClientInsert, ClientUpdate } from '@/types/enhanced'

export class ClientService {
  private supabase = createClient()

  /**
   * Get all clients
   */
  async getClients() {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  /**
   * Get a single client by ID
   */
  async getClient(id: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new client
   */
  async createClient(client: ClientInsert) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await this.supabase
      .from('clients')
      .insert({
        ...client,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an existing client
   */
  async updateClient(id: string, updates: ClientUpdate) {
    const { data, error } = await this.supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string) {
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get client with their projects
   */
  async getClientWithProjects(id: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .select(`
        *,
        projects(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }
}

export const clientService = new ClientService()
