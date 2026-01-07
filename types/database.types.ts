export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string;
          description: string | null;
          event_date: string;
          id: string;
          start_time: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          event_date: string;
          id?: string;
          start_time: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          event_date?: string;
          id?: string;
          start_time?: string;
          title?: string;
        };
        Relationships: [];
      };
      newcomers: {
        Row: {
          address: string | null;
          age_group: string | null;
          assigned_at: string | null;
          assigned_by: string | null;
          assigned_to: string | null;
          baptism_status: boolean | null;
          birthday_day: number | null;
          birthday_month: number | null;
          can_visit: boolean | null;
          career_sector: string | null;
          contact_notes: string | null;
          contacted: boolean | null;
          contacted_at: string | null;
          country_of_origin: string | null;
          created_at: string;
          department_interest: string[] | null;
          email: string | null;
          follow_up_status: string | null;
          full_name: string;
          gdpr_consent: boolean | null;
          gender: string | null;
          has_children: boolean | null;
          how_did_you_hear: string | null;
          id: string;
          interest_areas: string[] | null;
          is_born_again: string | null;
          join_whatsapp_group: boolean | null;
          marital_status: string | null;
          notes: string | null;
          occupation: string | null;
          phone: string | null;
          postcode: string | null;
          prayer_request: string | null;
          profession: string | null;
          service_time: string | null;
          start_date: string | null;
          status: string | null;
          surname: string | null;
          transport_mode: string | null;
          wedding_anniversary_day: number | null;
          wedding_anniversary_month: number | null;
          whatsapp_number: string | null;
        };
        Insert: {
          address?: string | null;
          age_group?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          assigned_to?: string | null;
          baptism_status?: boolean | null;
          birthday_day?: number | null;
          birthday_month?: number | null;
          can_visit?: boolean | null;
          career_sector?: string | null;
          contact_notes?: string | null;
          contacted?: boolean | null;
          contacted_at?: string | null;
          country_of_origin?: string | null;
          created_at?: string;
          department_interest?: string[] | null;
          email?: string | null;
          follow_up_status?: string | null;
          full_name: string;
          gdpr_consent?: boolean | null;
          gender?: string | null;
          has_children?: boolean | null;
          how_did_you_hear?: string | null;
          id?: string;
          interest_areas?: string[] | null;
          is_born_again?: string | null;
          join_whatsapp_group?: boolean | null;
          marital_status?: string | null;
          notes?: string | null;
          occupation?: string | null;
          phone?: string | null;
          postcode?: string | null;
          prayer_request?: string | null;
          profession?: string | null;
          service_time?: string | null;
          start_date?: string | null;
          status?: string | null;
          surname?: string | null;
          transport_mode?: string | null;
          wedding_anniversary_day?: number | null;
          wedding_anniversary_month?: number | null;
          whatsapp_number?: string | null;
        };
        Update: {
          address?: string | null;
          age_group?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          assigned_to?: string | null;
          baptism_status?: boolean | null;
          birthday_day?: number | null;
          birthday_month?: number | null;
          can_visit?: boolean | null;
          career_sector?: string | null;
          contact_notes?: string | null;
          contacted?: boolean | null;
          contacted_at?: string | null;
          country_of_origin?: string | null;
          created_at?: string;
          department_interest?: string[] | null;
          email?: string | null;
          follow_up_status?: string | null;
          full_name?: string;
          gdpr_consent?: boolean | null;
          gender?: string | null;
          has_children?: boolean | null;
          how_did_you_hear?: string | null;
          id?: string;
          interest_areas?: string[] | null;
          is_born_again?: string | null;
          join_whatsapp_group?: boolean | null;
          marital_status?: string | null;
          notes?: string | null;
          occupation?: string | null;
          phone?: string | null;
          postcode?: string | null;
          prayer_request?: string | null;
          profession?: string | null;
          service_time?: string | null;
          start_date?: string | null;
          status?: string | null;
          surname?: string | null;
          transport_mode?: string | null;
          wedding_anniversary_day?: number | null;
          wedding_anniversary_month?: number | null;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "newcomers_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
      rota_shifts: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          notification_sent_2d: boolean | null;
          notification_sent_2w: boolean | null;
          role_name: string;
          status: string | null;
          volunteer_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          notification_sent_2d?: boolean | null;
          notification_sent_2w?: boolean | null;
          role_name: string;
          status?: string | null;
          volunteer_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          notification_sent_2d?: boolean | null;
          notification_sent_2w?: boolean | null;
          role_name?: string;
          status?: string | null;
          volunteer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rota_shifts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rota_shifts_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// Type aliases for easier usage
export type Newcomer = Database["public"]["Tables"]["newcomers"]["Row"];
export type NewcomerInsert = Database["public"]["Tables"]["newcomers"]["Insert"];
export type NewcomerUpdate = Database["public"]["Tables"]["newcomers"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
