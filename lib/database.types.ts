// Database types for Supabase tables
// These match the schema in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string;
          quote_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          company: string | null;
          items: Json;
          decoration: Json | null;
          finishing: string[] | null;
          notes: string | null;
          subtotal: number;
          status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          company?: string | null;
          items: Json;
          decoration?: Json | null;
          finishing?: string[] | null;
          notes?: string | null;
          subtotal: number;
          status?: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          company?: string | null;
          items?: Json;
          decoration?: Json | null;
          finishing?: string[] | null;
          notes?: string | null;
          subtotal?: number;
          status?: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          service: string | null;
          message: string;
          status: 'new' | 'contacted' | 'resolved';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          service?: string | null;
          message: string;
          status?: 'new' | 'contacted' | 'resolved';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          service?: string | null;
          message?: string;
          status?: 'new' | 'contacted' | 'resolved';
          created_at?: string;
          updated_at?: string;
        };
      };
      abandoned_carts: {
        Row: {
          id: string;
          email: string;
          items: Json;
          decoration: Json | null;
          finishing: string[] | null;
          captured_at: string;
          recovered: boolean;
          recovery_sent_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          items: Json;
          decoration?: Json | null;
          finishing?: string[] | null;
          captured_at?: string;
          recovered?: boolean;
          recovery_sent_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          items?: Json;
          decoration?: Json | null;
          finishing?: string[] | null;
          captured_at?: string;
          recovered?: boolean;
          recovery_sent_at?: string | null;
        };
      };
      exit_captures: {
        Row: {
          id: string;
          email: string;
          page_url: string | null;
          cart_items: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          page_url?: string | null;
          cart_items?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          page_url?: string | null;
          cart_items?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type AbandonedCart = Database['public']['Tables']['abandoned_carts']['Row'];
export type AbandonedCartInsert = Database['public']['Tables']['abandoned_carts']['Insert'];
export type ExitCapture = Database['public']['Tables']['exit_captures']['Row'];
export type ExitCaptureInsert = Database['public']['Tables']['exit_captures']['Insert'];
