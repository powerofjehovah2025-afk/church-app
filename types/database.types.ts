/**
 * Database type definitions for Supabase tables
 * Generated for type-safe database operations
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          location: string | null;
          event_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          location?: string | null;
          event_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          location?: string | null;
          event_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rota_shifts: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          shift_date: string;
          shift_time: string | null;
          status: "Pending" | "Confirmed" | "Declined";
          role: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          shift_date: string;
          shift_time?: string | null;
          status?: "Pending" | "Confirmed" | "Declined";
          role?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          shift_date?: string;
          shift_time?: string | null;
          status?: "Pending" | "Confirmed" | "Declined";
          role?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      newcomers: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          age_group: string | null;
          marital_status: string | null;
          address: string | null;
          occupation: string | null;
          interest_areas: string[] | null;
          how_did_you_hear: string | null;
          service_time: string | null;
          notes: string | null;
          prayer_request: string | null;
          status: string | null;
          assigned_to: string | null;
          contacted: boolean | null;
          contacted_at: string | null;
          contact_notes: string | null;
          assigned_at: string | null;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          age_group?: string | null;
          marital_status?: string | null;
          address?: string | null;
          occupation?: string | null;
          interest_areas?: string[] | null;
          how_did_you_hear?: string | null;
          service_time?: string | null;
          notes?: string | null;
          prayer_request?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          contacted?: boolean | null;
          contacted_at?: string | null;
          contact_notes?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          age_group?: string | null;
          marital_status?: string | null;
          address?: string | null;
          occupation?: string | null;
          interest_areas?: string[] | null;
          how_did_you_hear?: string | null;
          service_time?: string | null;
          notes?: string | null;
          prayer_request?: string | null;
          status?: string | null;
          assigned_to?: string | null;
          contacted?: boolean | null;
          contacted_at?: string | null;
          contact_notes?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      rota_shift_status: "Pending" | "Confirmed" | "Declined";
    };
  };
}

// Convenience type exports for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type RotaShift = Database["public"]["Tables"]["rota_shifts"]["Row"];
export type RotaShiftInsert = Database["public"]["Tables"]["rota_shifts"]["Insert"];
export type RotaShiftUpdate = Database["public"]["Tables"]["rota_shifts"]["Update"];

export type Newcomer = Database["public"]["Tables"]["newcomers"]["Row"];
export type NewcomerInsert = Database["public"]["Tables"]["newcomers"]["Insert"];
export type NewcomerUpdate = Database["public"]["Tables"]["newcomers"]["Update"];

