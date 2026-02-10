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
      vaccine_dose_rules: {
        Row: {
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
        }
        Insert: {
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
        }
        Update: {
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
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          short_name: string | null
          total_doses: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          short_name?: string | null
          total_doses?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
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
      [_ in never]: never
    }
    Functions: {
      check_login_rate_limit: {
        Args: { p_ip: unknown; p_phone: string }
        Returns: Json
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      generate_notification_jobs_for_schedule: {
        Args: { p_schedule_id: string }
        Returns: number
      }
      generate_vaccine_schedules_for_baby: {
        Args: { p_baby_id: string }
        Returns: number
      }
      record_login_attempt: {
        Args: { p_ip: unknown; p_phone: string; p_success: boolean }
        Returns: undefined
      }
      revoke_all_user_sessions: { Args: { p_user_id: string }; Returns: number }
      update_vaccine_schedule_statuses: { Args: never; Returns: number }
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
