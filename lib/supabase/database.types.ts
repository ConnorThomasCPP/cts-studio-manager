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
      account_memberships: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          role: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          account_id: string
          asset_code: string
          brand: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          current_location_id: string | null
          home_location_id: string | null
          id: string
          model: string | null
          name: string
          notes: string | null
          photo_url: string | null
          purchase_value: number | null
          replacement_cost: number | null
          replacement_cost_updated_at: string | null
          serial_number: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string
          asset_code: string
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_location_id?: string | null
          home_location_id?: string | null
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          purchase_value?: number | null
          replacement_cost?: number | null
          replacement_cost_updated_at?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          asset_code?: string
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_location_id?: string | null
          home_location_id?: string | null
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          purchase_value?: number | null
          replacement_cost?: number | null
          replacement_cost_updated_at?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_home_location_id_fkey"
            columns: ["home_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          account_id: string
          auto_create_events: boolean | null
          auto_import_events: boolean | null
          calendar_id: string | null
          calendar_name: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          provider: string
          provider_account_email: string
          provider_account_id: string
          refresh_token: string | null
          sync_direction: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id?: string
          auto_create_events?: boolean | null
          auto_import_events?: boolean | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          provider: string
          provider_account_email: string
          provider_account_id: string
          refresh_token?: string | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          auto_create_events?: boolean | null
          auto_import_events?: boolean | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          provider?: string
          provider_account_email?: string
          provider_account_id?: string
          refresh_token?: string | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_syncs: {
        Row: {
          account_id: string
          connection_id: string
          created_at: string | null
          event_updated_at: string | null
          external_calendar_id: string
          external_event_id: string
          id: string
          last_synced_at: string | null
          local_etag: string | null
          remote_etag: string | null
          session_id: string
          session_updated_at: string | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string
          connection_id: string
          created_at?: string | null
          event_updated_at?: string | null
          external_calendar_id: string
          external_event_id: string
          id?: string
          last_synced_at?: string | null
          local_etag?: string | null
          remote_etag?: string | null
          session_id: string
          session_updated_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          connection_id?: string
          created_at?: string | null
          event_updated_at?: string | null
          external_calendar_id?: string
          external_event_id?: string
          id?: string
          last_synced_at?: string | null
          local_etag?: string | null
          remote_etag?: string | null
          session_id?: string
          session_updated_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_syncs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_syncs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_syncs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_id: string
          billing_address: string | null
          billing_email: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          default_hourly_rate: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string
          billing_address?: string | null
          billing_email?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          default_hourly_rate?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          billing_address?: string | null
          billing_email?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          default_hourly_rate?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          account_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          account_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          client_id: string
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          project_type: string | null
          rate_model: string | null
          start_date: string | null
          status: string
          storage_policy: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string
          client_id: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          project_type?: string | null
          rate_model?: string | null
          start_date?: string | null
          status?: string
          storage_policy?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_type?: string | null
          rate_model?: string | null
          start_date?: string | null
          status?: string
          storage_policy?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_assets: {
        Row: {
          account_id: string
          asset_id: string
          check_in_condition: string | null
          check_out_condition: string | null
          checked_in_at: string | null
          checked_out_at: string
          id: string
          notes: string | null
          session_id: string
        }
        Insert: {
          account_id?: string
          asset_id: string
          check_in_condition?: string | null
          check_out_condition?: string | null
          checked_in_at?: string | null
          checked_out_at?: string
          id?: string
          notes?: string | null
          session_id: string
        }
        Update: {
          account_id?: string
          asset_id?: string
          check_in_condition?: string | null
          check_out_condition?: string | null
          checked_in_at?: string | null
          checked_out_at?: string
          id?: string
          notes?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendees: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          is_organizer: boolean | null
          session_id: string
          user_id: string
        }
        Insert: {
          account_id?: string
          created_at?: string | null
          id?: string
          is_organizer?: boolean | null
          session_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          is_organizer?: boolean | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendees_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          account_id: string
          client_name: string
          created_at: string | null
          created_by: string | null
          end_time: string | null
          engineer: string
          id: string
          notes: string | null
          project_id: string | null
          session_name: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string
          client_name: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          engineer: string
          id?: string
          notes?: string | null
          project_id?: string | null
          session_name: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          engineer?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          session_name?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stem_comments: {
        Row: {
          account_id: string
          content: string
          created_at: string | null
          id: string
          stem_id: string
          timestamp: number
          user_id: string
        }
        Insert: {
          account_id?: string
          content: string
          created_at?: string | null
          id?: string
          stem_id: string
          timestamp: number
          user_id: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string | null
          id?: string
          stem_id?: string
          timestamp?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stem_comments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_comments_stem_id_fkey"
            columns: ["stem_id"]
            isOneToOne: false
            referencedRelation: "stems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stem_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stems: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          created_by: string | null
          download_count: number | null
          duration: number | null
          file_path: string
          file_size: number | null
          icon: string | null
          id: string
          mime_type: string | null
          name: string
          sort_order: number | null
          track_id: string
          type: string | null
          updated_at: string | null
          waveform_data: Json | null
        }
        Insert: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          download_count?: number | null
          duration?: number | null
          file_path: string
          file_size?: number | null
          icon?: string | null
          id?: string
          mime_type?: string | null
          name: string
          sort_order?: number | null
          track_id: string
          type?: string | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          download_count?: number | null
          duration?: number | null
          file_path?: string
          file_size?: number | null
          icon?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          sort_order?: number | null
          track_id?: string
          type?: string | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stems_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          account_id: string
          bpm: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          key: string | null
          name: string
          project_id: string
          status: string | null
          track_no: number | null
          updated_at: string | null
          waveform_data: Json | null
        }
        Insert: {
          account_id?: string
          bpm?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          key?: string | null
          name: string
          project_id: string
          status?: string | null
          track_no?: number | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Update: {
          account_id?: string
          bpm?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          key?: string | null
          name?: string
          project_id?: string
          status?: string | null
          track_no?: number | null
          updated_at?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "active_projects_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          asset_id: string
          condition: string | null
          from_location_id: string | null
          from_status: string | null
          id: string
          metadata: Json | null
          note: string | null
          session_id: string | null
          timestamp: string
          to_location_id: string | null
          to_status: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string
          asset_id: string
          condition?: string | null
          from_location_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          session_id?: string | null
          timestamp?: string
          to_location_id?: string | null
          to_status?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string
          asset_id?: string
          condition?: string | null
          from_location_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          session_id?: string | null
          timestamp?: string
          to_location_id?: string | null
          to_status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active_account_id: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string
          photo_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          active_account_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          name: string
          photo_url?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          active_account_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_active_account_id_fkey"
            columns: ["active_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_projects_summary: {
        Row: {
          client_name: string | null
          end_date: string | null
          id: string | null
          name: string | null
          project_type: string | null
          session_count: number | null
          start_date: string | null
          status: string | null
          track_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_complete_session: { Args: { p_session_id: string }; Returns: Json }
      check_in_asset: {
        Args: {
          p_asset_id: string
          p_condition?: string
          p_note?: string
          p_session_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      check_out_asset: {
        Args: {
          p_asset_id: string
          p_condition?: string
          p_note?: string
          p_session_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      generate_asset_code: {
        Args: { p_category_name?: string }
        Returns: string
      }
      get_active_account_id: { Args: never; Returns: string }
      get_active_session_assets: {
        Args: { p_session_id: string }
        Returns: {
          asset_code: string
          asset_id: string
          asset_name: string
          brand: string
          check_in_condition: string
          check_out_condition: string
          checked_in_at: string
          checked_out_at: string
          model: string
          notes: string
        }[]
      }
      get_asset_history: {
        Args: { p_asset_id: string; p_limit?: number }
        Returns: {
          condition: string
          created_at: string
          from_status: string
          metadata: Json
          note: string
          session_name: string
          to_status: string
          transaction_id: string
          type: string
          user_name: string
        }[]
      }
      get_track_stems_with_comments: {
        Args: { track_uuid: string }
        Returns: {
          color: string
          comment_count: number
          created_at: string
          created_by: string
          download_count: number
          duration: number
          file_path: string
          file_size: number
          icon: string
          id: string
          mime_type: string
          name: string
          sort_order: number
          track_id: string
          type: string
          updated_at: string
          waveform_data: Json
        }[]
      }
      get_user_emails_for_session: {
        Args: { p_session_id: string }
        Returns: {
          email: string
          is_organizer: boolean
          name: string
          user_id: string
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      has_active_account_role: {
        Args: { p_account_id: string; p_roles: string[] }
        Returns: boolean
      }
      increment_stem_download: {
        Args: { stem_uuid: string }
        Returns: undefined
      }
      is_active_account_member: {
        Args: { p_account_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
