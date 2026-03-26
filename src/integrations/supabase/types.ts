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
      community_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string | null
        }
        Insert: { id?: string; post_id: string; user_id: string; content: string; created_at?: string | null }
        Update: { id?: string; post_id?: string; user_id?: string; content?: string; created_at?: string | null }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_likes: {
        Row: { post_id: string; user_id: string; created_at: string | null }
        Insert: { post_id: string; user_id: string; created_at?: string | null }
        Update: { post_id?: string; user_id?: string; created_at?: string | null }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: { id?: string; user_id: string; title: string; content: string; category?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; user_id?: string; title?: string; content?: string; category?: string | null; created_at?: string | null; updated_at?: string | null }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vaccine_knowledge: {
        Row: { id: string; question: string; keywords: string; answer: string; source: string | null; created_at: string | null }
        Insert: { id?: string; question: string; keywords: string; answer: string; source?: string | null; created_at?: string | null }
        Update: { id?: string; question?: string; keywords?: string; answer?: string; source?: string | null; created_at?: string | null }
        Relationships: []
      }
      admin_action_limits: {
        Row: {
          action_count: number
          action_minute: string
          admin_id: string
          id: string
        }
        Insert: {
          action_count?: number
          action_minute?: string
          admin_id: string
          id?: string
        }
        Update: {
          action_count?: number
          action_minute?: string
          admin_id?: string
          id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      babies: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          dob: string
          gender: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          dob: string
          gender?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          dob?: string
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "babies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      background_jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number | null
          payload: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          phone: string
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone: string
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone?: string
          success?: boolean | null
        }
        Relationships: []
      }
      login_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_failures: {
        Row: {
          error_message: string
          failed_at: string | null
          id: string
          job_id: string
        }
        Insert: {
          error_message: string
          failed_at?: string | null
          id?: string
          job_id: string
        }
        Update: {
          error_message?: string
          failed_at?: string | null
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_failures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "notification_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_jobs: {
        Row: {
          baby_id: string
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          notify_type: string
          retry_count: number
          schedule_id: string
          scheduled_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          baby_id: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notify_type: string
          retry_count?: number
          schedule_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          baby_id?: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          notify_type?: string
          retry_count?: number
          schedule_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_jobs_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_jobs_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_dashboard_summary"
            referencedColumns: ["baby_id"]
          },
          {
            foreignKeyName: "notification_jobs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "vaccine_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string
          channel: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          jobs_created: number
          jobs_failed: number
          jobs_retried: number
          jobs_sent: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          jobs_created?: number
          jobs_failed?: number
          jobs_retried?: number
          jobs_sent?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          jobs_created?: number
          jobs_failed?: number
          jobs_retried?: number
          jobs_sent?: number
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          enable_email: boolean
          enable_push: boolean
          enable_zalo: boolean
          quiet_end: string
          quiet_start: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_email?: boolean
          enable_push?: boolean
          enable_zalo?: boolean
          quiet_end?: string
          quiet_start?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_email?: boolean
          enable_push?: boolean
          enable_zalo?: boolean
          quiet_end?: string
          quiet_start?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          title_template: string
          type: string | null
        }
        Insert: {
          body_template: string
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_template: string
          type?: string | null
        }
        Update: {
          body_template?: string
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_template?: string
          type?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          deep_link: string | null
          id: string
          job_id: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          deep_link?: string | null
          id?: string
          job_id?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          deep_link?: string | null
          id?: string
          job_id?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "notification_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_subscriptions: {
        Row: {
          payment_id: string
          subscription_id: string
        }
        Insert: {
          payment_id: string
          subscription_id: string
        }
        Update: {
          payment_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          baby_ids: string[]
          created_at: string | null
          id: string
          proof_image_url: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          baby_ids: string[]
          created_at?: string | null
          id?: string
          proof_image_url: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          baby_ids?: string[]
          created_at?: string | null
          id?: string
          proof_image_url?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          last_login_at: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login_at?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login_at?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_versions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          published_at: string | null
          published_by: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          published_by?: string | null
          version: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          published_by?: string | null
          version?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          baby_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          baby_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          baby_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_dashboard_summary"
            referencedColumns: ["baby_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          metadata?: Json | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics_daily: {
        Row: {
          completed_vaccines: number
          created_at: string
          id: string
          metric_date: string
          overdue_vaccines: number
          pending_vaccines: number
          total_babies: number
          total_payments: number
          total_revenue: number
          total_users: number
          total_vaccine_schedules: number
        }
        Insert: {
          completed_vaccines?: number
          created_at?: string
          id?: string
          metric_date: string
          overdue_vaccines?: number
          pending_vaccines?: number
          total_babies?: number
          total_payments?: number
          total_revenue?: number
          total_users?: number
          total_vaccine_schedules?: number
        }
        Update: {
          completed_vaccines?: number
          created_at?: string
          id?: string
          metric_date?: string
          overdue_vaccines?: number
          pending_vaccines?: number
          total_babies?: number
          total_payments?: number
          total_revenue?: number
          total_users?: number
          total_vaccine_schedules?: number
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_token: string
          device_type: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_token: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_token?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccine_dose_rules: {
        Row: {
          applied_from: string | null
          created_at: string | null
          dose_number: number
          id: string
          is_active: boolean | null
          max_age_days: number | null
          min_age_days: number
          min_interval_days: number | null
          notes: string | null
          recommended_age_days: number
          updated_at: string | null
          vaccine_id: string
          version: number | null
        }
        Insert: {
          applied_from?: string | null
          created_at?: string | null
          dose_number: number
          id?: string
          is_active?: boolean | null
          max_age_days?: number | null
          min_age_days: number
          min_interval_days?: number | null
          notes?: string | null
          recommended_age_days: number
          updated_at?: string | null
          vaccine_id: string
          version?: number | null
        }
        Update: {
          applied_from?: string | null
          created_at?: string | null
          dose_number?: number
          id?: string
          is_active?: boolean | null
          max_age_days?: number | null
          min_age_days?: number
          min_interval_days?: number | null
          notes?: string | null
          recommended_age_days?: number
          updated_at?: string | null
          vaccine_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_dose_rules_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_history: {
        Row: {
          batch_number: string | null
          created_at: string | null
          id: string
          injected_date: string
          location: string | null
          notes: string | null
          schedule_id: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          injected_date: string
          location?: string | null
          notes?: string | null
          schedule_id: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          id?: string
          injected_date?: string
          location?: string | null
          notes?: string | null
          schedule_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_history_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: true
            referencedRelation: "vaccine_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_history_images: {
        Row: {
          created_at: string | null
          history_id: string
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string | null
          history_id: string
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string | null
          history_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_history_images_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "vaccine_history"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_schedules: {
        Row: {
          baby_id: string
          created_at: string | null
          dose_number: number
          generated_from_rule_id: string | null
          id: string
          is_catchup: boolean | null
          is_manual: boolean | null
          scheduled_date: string
          skipped_reason: string | null
          status: string
          updated_at: string | null
          vaccine_id: string
        }
        Insert: {
          baby_id: string
          created_at?: string | null
          dose_number: number
          generated_from_rule_id?: string | null
          id?: string
          is_catchup?: boolean | null
          is_manual?: boolean | null
          scheduled_date: string
          skipped_reason?: string | null
          status?: string
          updated_at?: string | null
          vaccine_id: string
        }
        Update: {
          baby_id?: string
          created_at?: string | null
          dose_number?: number
          generated_from_rule_id?: string | null
          id?: string
          is_catchup?: boolean | null
          is_manual?: boolean | null
          scheduled_date?: string
          skipped_reason?: string | null
          status?: string
          updated_at?: string | null
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_schedules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_dashboard_summary"
            referencedColumns: ["baby_id"]
          },
          {
            foreignKeyName: "vaccine_schedules_generated_from_rule_id_fkey"
            columns: ["generated_from_rule_id"]
            isOneToOne: false
            referencedRelation: "vaccine_dose_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedules_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          code: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          name: string
          short_name: string | null
          total_doses: number
          type: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name: string
          short_name?: string | null
          total_doses?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name?: string
          short_name?: string | null
          total_doses?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      baby_dashboard_summary: {
        Row: {
          baby_id: string | null
          baby_name: string | null
          completed_count: number | null
          dob: string | null
          gender: string | null
          next_dose_number: number | null
          next_vaccine_date: string | null
          next_vaccine_days: number | null
          next_vaccine_name: string | null
          overdue_count: number | null
          pending_count: number | null
          total_vaccines: number | null
          upcoming_count: number | null
        }
        Relationships: []
      }
      baby_vaccine_status: {
        Row: {
          baby_id: string | null
          completed: number | null
          next_due_date: string | null
          overdue: number | null
          pending: number | null
          skipped: number | null
          total_vaccines: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_schedules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_dashboard_summary"
            referencedColumns: ["baby_id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_daily_metrics: { Args: never; Returns: undefined }
      approve_payment_transaction: {
        Args: {
          p_admin_id: string
          p_admin_notes?: string
          p_payment_id: string
        }
        Returns: undefined
      }
      check_admin_rate_limit: { Args: { p_admin_id: string }; Returns: boolean }
      check_data_integrity: { Args: never; Returns: Json }
      check_login_rate_limit: {
        Args: { p_ip: unknown; p_phone: string }
        Returns: Json
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      export_babies: {
        Args: never
        Returns: {
          created_at: string
          dob: string
          gender: string
          id: string
          name: string
        }[]
      }
      export_payments: {
        Args: never
        Returns: {
          amount: number
          created_at: string
          id: string
          reviewed_at: string
          status: string
          user_id: string
        }[]
      }
      export_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          last_login_at: string
          phone: string
        }[]
      }
      export_vaccinations: {
        Args: never
        Returns: {
          baby_id: string
          dose_number: number
          id: string
          scheduled_date: string
          status: string
          vaccine_id: string
        }[]
      }
      generate_notification_jobs_for_schedule: {
        Args: { p_schedule_id: string }
        Returns: number
      }
      generate_vaccine_schedules_for_baby: {
        Args: { p_baby_id: string }
        Returns: number
      }
      get_next_vaccine: {
        Args: { p_baby_id: string }
        Returns: {
          days_until_due: number
          dose_number: number
          is_overdue: boolean
          overdue_days: number
          schedule_id: string
          scheduled_date: string
          vaccine_code: string
          vaccine_name: string
        }[]
      }
      get_upcoming_vaccines: {
        Args: { p_baby_id: string; p_days_ahead?: number }
        Returns: {
          days_until_due: number
          dose_number: number
          is_overdue: boolean
          schedule_id: string
          scheduled_date: string
          status: string
          vaccine_code: string
          vaccine_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_system_error: {
        Args: {
          p_error_message: string
          p_error_type: string
          p_metadata?: Json
          p_source: string
          p_user_id?: string
        }
        Returns: undefined
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      recalculate_future_doses: {
        Args: { p_schedule_id: string }
        Returns: number
      }
      record_login_attempt: {
        Args: { p_ip: unknown; p_phone: string; p_success: boolean }
        Returns: undefined
      }
      restore_backup: { Args: { p_file_name: string }; Returns: Json }
      revoke_all_user_sessions: { Args: { p_user_id: string }; Returns: number }
      soft_delete_vaccine: {
        Args: { p_admin_id: string; p_vaccine_id: string }
        Returns: undefined
      }
      mark_vaccine_done_atomic: {
        Args: {
          p_schedule_id: string
          p_user_id: string
          p_injected_date: string
          p_batch_number?: string | null
          p_location?: string | null
          p_notes?: string | null
          p_image_paths?: string[] | null
        }
        Returns: Database["public"]["Tables"]["vaccine_history"]["Row"]
      }
      undo_vaccine_completion: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      update_vaccine_schedule_statuses: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "medical_admin"
        | "finance_admin"
        | "support_admin"
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
    Enums: {
      app_role: [
        "super_admin",
        "medical_admin",
        "finance_admin",
        "support_admin",
      ],
    },
  },
} as const
