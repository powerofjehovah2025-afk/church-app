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
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      newcomers: {
        Row: {
          address: string | null
          age_group: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          baptism_status: boolean | null
          birthday_day: number | null
          birthday_month: number | null
          can_visit: boolean | null
          career_sector: string | null
          contact_notes: string | null
          contacted: boolean | null
          contacted_at: string | null
          country_of_origin: string | null
          created_at: string
          department_interest: string[] | null
          email: string | null
          follow_up_status: string | null
          full_name: string
          gdpr_consent: boolean | null
          gender: string | null
          has_children: boolean | null
          how_did_you_hear: string | null
          id: string
          interest_areas: string[] | null
          is_born_again: string | null
          join_whatsapp_group: boolean | null
          marital_status: string | null
          notes: string | null
          occupation: string | null
          phone: string | null
          postcode: string | null
          prayer_request: string | null
          profession: string | null
          service_time: string | null
          start_date: string | null
          status: string | null
          surname: string | null
          transport_mode: string | null
          wedding_anniversary_day: number | null
          wedding_anniversary_month: number | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          age_group?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          baptism_status?: boolean | null
          birthday_day?: number | null
          birthday_month?: number | null
          can_visit?: boolean | null
          career_sector?: string | null
          contact_notes?: string | null
          contacted?: boolean | null
          contacted_at?: string | null
          country_of_origin?: string | null
          created_at?: string
          department_interest?: string[] | null
          email?: string | null
          follow_up_status?: string | null
          full_name: string
          gdpr_consent?: boolean | null
          gender?: string | null
          has_children?: boolean | null
          how_did_you_hear?: string | null
          id?: string
          interest_areas?: string[] | null
          is_born_again?: string | null
          join_whatsapp_group?: boolean | null
          marital_status?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          postcode?: string | null
          prayer_request?: string | null
          profession?: string | null
          service_time?: string | null
          start_date?: string | null
          status?: string | null
          surname?: string | null
          transport_mode?: string | null
          wedding_anniversary_day?: number | null
          wedding_anniversary_month?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          age_group?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          baptism_status?: boolean | null
          birthday_day?: number | null
          birthday_month?: number | null
          can_visit?: boolean | null
          career_sector?: string | null
          contact_notes?: string | null
          contacted?: boolean | null
          contacted_at?: string | null
          country_of_origin?: string | null
          created_at?: string
          department_interest?: string[] | null
          email?: string | null
          follow_up_status?: string | null
          full_name?: string
          gdpr_consent?: boolean | null
          gender?: string | null
          has_children?: boolean | null
          how_did_you_hear?: string | null
          id?: string
          interest_areas?: string[] | null
          is_born_again?: string | null
          join_whatsapp_group?: boolean | null
          marital_status?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          postcode?: string | null
          prayer_request?: string | null
          profession?: string | null
          service_time?: string | null
          start_date?: string | null
          status?: string | null
          surname?: string | null
          transport_mode?: string | null
          wedding_anniversary_day?: number | null
          wedding_anniversary_month?: number | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newcomers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      rota_shifts: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notification_sent_2d: boolean | null
          notification_sent_2w: boolean | null
          role_name: string
          status: string | null
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notification_sent_2d?: boolean | null
          notification_sent_2w?: boolean | null
          role_name: string
          status?: string | null
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notification_sent_2d?: boolean | null
          notification_sent_2w?: boolean | null
          role_name?: string
          status?: string | null
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rota_shifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          date: string
          name: string
          time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          name: string
          time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          name?: string
          time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      duty_types: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_assignments: {
        Row: {
          id: string
          service_id: string
          duty_type_id: string
          member_id: string
          status: string
          assigned_by: string
          assigned_at: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          duty_type_id: string
          member_id: string
          status?: string
          assigned_by: string
          assigned_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          duty_type_id?: string
          member_id?: string
          status?: string
          assigned_by?: string
          assigned_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_duty_type_id_fkey"
            columns: ["duty_type_id"]
            isOneToOne: false
            referencedRelation: "duty_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_configs: {
        Row: {
          id: string
          form_type: string
          title: string
          description: string | null
          is_active: boolean
          version: number
          status: string
          version_name: string | null
          parent_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_type: string
          title: string
          description?: string | null
          is_active?: boolean
          version?: number
          status?: string
          version_name?: string | null
          parent_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_type?: string
          title?: string
          description?: string | null
          is_active?: boolean
          version?: number
          status?: string
          version_name?: string | null
          parent_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_configs_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          id: string
          form_config_id: string
          field_key: string
          field_type: string
          label: string
          placeholder: string | null
          description: string | null
          is_required: boolean
          validation_rules: Json
          default_value: string | null
          display_order: number
          section: string | null
          options: Json
          db_column: string | null
          transformation_type: string | null
          transformation_config: Json
          is_notes_field: boolean
          notes_format: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_config_id: string
          field_key: string
          field_type: string
          label: string
          placeholder?: string | null
          description?: string | null
          is_required?: boolean
          validation_rules?: Json
          default_value?: string | null
          display_order?: number
          db_column?: string | null
          transformation_type?: string | null
          transformation_config?: Json
          is_notes_field?: boolean
          notes_format?: string | null
          section?: string | null
          options?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_config_id?: string
          field_key?: string
          field_type?: string
          label?: string
          placeholder?: string | null
          description?: string | null
          is_required?: boolean
          validation_rules?: Json
          default_value?: string | null
          display_order?: number
          section?: string | null
          options?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_static_content: {
        Row: {
          id: string
          form_config_id: string
          content_key: string
          content: string
          content_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_config_id: string
          content_key: string
          content: string
          content_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_config_id?: string
          content_key?: string
          content?: string
          content_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_static_content_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_rules: {
        Row: {
          id: string
          form_config_id: string
          rule_type: string
          rule_config: Json
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_config_id: string
          rule_type: string
          rule_config?: Json
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_config_id?: string
          rule_type?: string
          rule_config?: Json
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_rules_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "form_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          hierarchy_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          hierarchy_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          hierarchy_level?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_key: string
          granted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_key: string
          granted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_key?: string
          granted?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string
          assigned_by: string
          status: string
          priority: string
          due_date: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to: string
          assigned_by: string
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string
          assigned_by?: string
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string
          body: string
          is_read: boolean
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject: string
          body: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string
          body?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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

// Type aliases for easier usage
export type Newcomer = Database["public"]["Tables"]["newcomers"]["Row"]
export type NewcomerInsert = Database["public"]["Tables"]["newcomers"]["Insert"]
export type NewcomerUpdate = Database["public"]["Tables"]["newcomers"]["Update"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Event = Database["public"]["Tables"]["events"]["Row"]
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"]
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"]

export type Service = Database["public"]["Tables"]["services"]["Row"]
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"]
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"]

export type DutyType = Database["public"]["Tables"]["duty_types"]["Row"]
export type DutyTypeInsert = Database["public"]["Tables"]["duty_types"]["Insert"]
export type DutyTypeUpdate = Database["public"]["Tables"]["duty_types"]["Update"]

export type ServiceAssignment = Database["public"]["Tables"]["service_assignments"]["Row"]
export type ServiceAssignmentInsert = Database["public"]["Tables"]["service_assignments"]["Insert"]
export type ServiceAssignmentUpdate = Database["public"]["Tables"]["service_assignments"]["Update"]

export type FormConfig = Database["public"]["Tables"]["form_configs"]["Row"]
export type FormConfigInsert = Database["public"]["Tables"]["form_configs"]["Insert"]
export type FormConfigUpdate = Database["public"]["Tables"]["form_configs"]["Update"]

export type FormField = Database["public"]["Tables"]["form_fields"]["Row"]
export type FormFieldInsert = Database["public"]["Tables"]["form_fields"]["Insert"]
export type FormFieldUpdate = Database["public"]["Tables"]["form_fields"]["Update"]

export type FormStaticContent = Database["public"]["Tables"]["form_static_content"]["Row"]
export type FormStaticContentInsert = Database["public"]["Tables"]["form_static_content"]["Insert"]
export type FormStaticContentUpdate = Database["public"]["Tables"]["form_static_content"]["Update"]

export type FormSubmissionRule = Database["public"]["Tables"]["form_submission_rules"]["Row"]
export type FormSubmissionRuleInsert = Database["public"]["Tables"]["form_submission_rules"]["Insert"]
export type FormSubmissionRuleUpdate = Database["public"]["Tables"]["form_submission_rules"]["Update"]

export type Role = Database["public"]["Tables"]["roles"]["Row"]
export type RoleInsert = Database["public"]["Tables"]["roles"]["Insert"]
export type RoleUpdate = Database["public"]["Tables"]["roles"]["Update"]

export type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"]
export type RolePermissionInsert = Database["public"]["Tables"]["role_permissions"]["Insert"]
export type RolePermissionUpdate = Database["public"]["Tables"]["role_permissions"]["Update"]

export type Task = Database["public"]["Tables"]["tasks"]["Row"]
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"]

export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"]
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"]

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]