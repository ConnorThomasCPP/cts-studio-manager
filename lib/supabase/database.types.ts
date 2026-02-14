/**
 * Database Types for Supabase Client
 *
 * These types represent the Supabase database schema.
 * Auto-generated from the database schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'engineer' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'admin' | 'engineer' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'engineer' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          asset_code: string
          name: string
          category_id: string | null
          brand: string | null
          model: string | null
          serial_number: string | null
          status: 'available' | 'checked_out' | 'maintenance' | 'missing'
          home_location_id: string | null
          current_location_id: string | null
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          asset_code: string
          name: string
          category_id?: string | null
          brand?: string | null
          model?: string | null
          serial_number?: string | null
          status?: 'available' | 'checked_out' | 'maintenance' | 'missing'
          home_location_id?: string | null
          current_location_id?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          asset_code?: string
          name?: string
          category_id?: string | null
          brand?: string | null
          model?: string | null
          serial_number?: string | null
          status?: 'available' | 'checked_out' | 'maintenance' | 'missing'
          home_location_id?: string | null
          current_location_id?: string | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          session_name: string
          client_name: string
          engineer: string
          start_time: string
          end_time: string | null
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          session_name: string
          client_name: string
          engineer: string
          start_time: string
          end_time?: string | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          session_name?: string
          client_name?: string
          engineer?: string
          start_time?: string
          end_time?: string | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      session_assets: {
        Row: {
          id: string
          session_id: string
          asset_id: string
          checked_out_at: string
          checked_in_at: string | null
          check_out_condition: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          check_in_condition: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          notes: string | null
        }
        Insert: {
          id?: string
          session_id: string
          asset_id: string
          checked_out_at?: string
          checked_in_at?: string | null
          check_out_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          check_in_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          notes?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          asset_id?: string
          checked_out_at?: string
          checked_in_at?: string | null
          check_out_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          check_in_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          notes?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          asset_id: string
          session_id: string | null
          type: 'check_out' | 'check_in' | 'status_change' | 'created' | 'updated'
          timestamp: string
          user_id: string
          condition: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          from_status: string | null
          to_status: string | null
          from_location_id: string | null
          to_location_id: string | null
          note: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          asset_id: string
          session_id?: string | null
          type: 'check_out' | 'check_in' | 'status_change' | 'created' | 'updated'
          timestamp?: string
          user_id: string
          condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          from_status?: string | null
          to_status?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          note?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          asset_id?: string
          session_id?: string | null
          type?: 'check_out' | 'check_in' | 'status_change' | 'created' | 'updated'
          timestamp?: string
          user_id?: string
          condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance' | null
          from_status?: string | null
          to_status?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          note?: string | null
          metadata?: Json | null
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'review' | 'completed' | 'archived'
          deadline: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          status?: 'planning' | 'active' | 'review' | 'completed' | 'archived'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          status?: 'planning' | 'active' | 'review' | 'completed' | 'archived'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      tracks: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          bpm: number | null
          key: string | null
          duration: number | null
          waveform_data: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          duration?: number | null
          waveform_data?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          duration?: number | null
          waveform_data?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      stems: {
        Row: {
          id: string
          track_id: string
          name: string
          type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other' | null
          color: string
          icon: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          duration: number | null
          waveform_data: Json | null
          sort_order: number
          download_count: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          track_id: string
          name: string
          type?: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other' | null
          color?: string
          icon?: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          duration?: number | null
          waveform_data?: Json | null
          sort_order?: number
          download_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          track_id?: string
          name?: string
          type?: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other' | null
          color?: string
          icon?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          duration?: number | null
          waveform_data?: Json | null
          sort_order?: number
          download_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      stem_comments: {
        Row: {
          id: string
          stem_id: string
          user_id: string
          timestamp: number
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          stem_id: string
          user_id: string
          timestamp: number
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          stem_id?: string
          user_id?: string
          timestamp?: number
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_out_asset: {
        Args: {
          p_asset_id: string
          p_session_id: string
          p_user_id?: string
          p_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance'
          p_note?: string
        }
        Returns: Json
      }
      check_in_asset: {
        Args: {
          p_asset_id: string
          p_session_id?: string
          p_user_id?: string
          p_condition?: 'good' | 'fair' | 'damaged' | 'needs_maintenance'
          p_note?: string
        }
        Returns: Json
      }
      can_complete_session: {
        Args: {
          p_session_id: string
        }
        Returns: Json
      }
      generate_asset_code: {
        Args: {
          p_category_name?: string
        }
        Returns: string
      }
      get_track_stems_with_comments: {
        Args: {
          track_uuid: string
        }
        Returns: Array<{
          id: string
          track_id: string
          name: string
          type: string | null
          color: string
          icon: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          duration: number | null
          waveform_data: Json | null
          sort_order: number
          download_count: number
          comment_count: number
          created_at: string
          updated_at: string
          created_by: string | null
        }>
      }
      increment_stem_download: {
        Args: {
          stem_uuid: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
