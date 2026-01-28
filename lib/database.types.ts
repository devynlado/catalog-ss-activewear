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
          recovery_token: string | null;
          expires_at: string | null;
          email_sent_at: string | null;
          email_opened_at: string | null;
          recovered_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          page_url?: string | null;
          cart_items?: Json | null;
          recovery_token?: string | null;
          expires_at?: string | null;
          email_sent_at?: string | null;
          email_opened_at?: string | null;
          recovered_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          page_url?: string | null;
          cart_items?: Json | null;
          recovery_token?: string | null;
          expires_at?: string | null;
          email_sent_at?: string | null;
          email_opened_at?: string | null;
          recovered_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
        };
      };
      // Product Cache Tables
      products: {
        Row: {
          style_id: number;
          style_name: string;
          slug: string | null;
          brand_id: number | null;
          brand_name: string;
          title_raw: string | null;
          title_optimized: string | null;
          description_raw: string | null;
          description_optimized: string | null;
          base_category: string | null;
          product_type: string | null;
          google_category_id: number | null;
          google_category_name: string | null;
          primary_image_url: string | null;
          material: string | null;
          gender: string;
          age_group: string;
          is_sustainable: boolean;
          is_new: boolean;
          is_popular: boolean;
          popular_tier: string | null;
          is_active: boolean;
          color_count: number;
          base_price: number | null;
          min_retail_price: number | null;
          min_sale_price: number | null;
          is_on_sale: boolean;
          last_full_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          style_id: number;
          style_name: string;
          slug?: string | null;
          brand_id?: number | null;
          brand_name: string;
          title_raw?: string | null;
          title_optimized?: string | null;
          description_raw?: string | null;
          description_optimized?: string | null;
          base_category?: string | null;
          product_type?: string | null;
          google_category_id?: number | null;
          google_category_name?: string | null;
          primary_image_url?: string | null;
          material?: string | null;
          gender?: string;
          age_group?: string;
          is_sustainable?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          popular_tier?: string | null;
          is_active?: boolean;
          color_count?: number;
          base_price?: number | null;
          min_retail_price?: number | null;
          min_sale_price?: number | null;
          is_on_sale?: boolean;
          last_full_sync?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          style_id?: number;
          style_name?: string;
          slug?: string | null;
          brand_id?: number | null;
          brand_name?: string;
          title_raw?: string | null;
          title_optimized?: string | null;
          description_raw?: string | null;
          description_optimized?: string | null;
          base_category?: string | null;
          product_type?: string | null;
          google_category_id?: number | null;
          google_category_name?: string | null;
          primary_image_url?: string | null;
          material?: string | null;
          gender?: string;
          age_group?: string;
          is_sustainable?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          popular_tier?: string | null;
          is_active?: boolean;
          color_count?: number;
          base_price?: number | null;
          min_retail_price?: number | null;
          min_sale_price?: number | null;
          is_on_sale?: boolean;
          last_full_sync?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_colors: {
        Row: {
          id: string;
          style_id: number;
          color_name: string;
          color_code: string;
          color_family: string | null;
          swatch_image: string | null;
          front_image: string | null;
          back_image: string | null;
          side_image: string | null;
          on_model_front: string | null;
          on_model_back: string | null;
          on_model_side: string | null;
          additional_images: string[] | null;
          availability: string;
          created_at: string;
        };
        Insert: {
          id: string;
          style_id: number;
          color_name: string;
          color_code: string;
          color_family?: string | null;
          swatch_image?: string | null;
          front_image?: string | null;
          back_image?: string | null;
          side_image?: string | null;
          on_model_front?: string | null;
          on_model_back?: string | null;
          on_model_side?: string | null;
          additional_images?: string[] | null;
          availability?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          style_id?: number;
          color_name?: string;
          color_code?: string;
          color_family?: string | null;
          swatch_image?: string | null;
          front_image?: string | null;
          back_image?: string | null;
          side_image?: string | null;
          on_model_front?: string | null;
          on_model_back?: string | null;
          on_model_side?: string | null;
          additional_images?: string[] | null;
          availability?: string;
          created_at?: string;
        };
      };
      product_skus: {
        Row: {
          sku: string;
          style_id: number;
          color_id: string;
          color_name: string;
          color_code: string;
          size_name: string;
          size_code: string | null;
          size_order: string | null;
          cogs: number | null;
          retail_price: number | null;
          sale_price: number | null;
          auto_min_price: number | null;
          gtin: string | null;
          piece_weight: number | null;
          qty: number;
          availability: string;
          last_inventory_sync: string | null;
          created_at: string;
        };
        Insert: {
          sku: string;
          style_id: number;
          color_id: string;
          color_name: string;
          color_code: string;
          size_name: string;
          size_code?: string | null;
          size_order?: string | null;
          cogs?: number | null;
          retail_price?: number | null;
          sale_price?: number | null;
          auto_min_price?: number | null;
          gtin?: string | null;
          piece_weight?: number | null;
          qty?: number;
          availability?: string;
          last_inventory_sync?: string | null;
          created_at?: string;
        };
        Update: {
          sku?: string;
          style_id?: number;
          color_id?: string;
          color_name?: string;
          color_code?: string;
          size_name?: string;
          size_code?: string | null;
          size_order?: string | null;
          cogs?: number | null;
          retail_price?: number | null;
          sale_price?: number | null;
          auto_min_price?: number | null;
          gtin?: string | null;
          piece_weight?: number | null;
          qty?: number;
          availability?: string;
          last_inventory_sync?: string | null;
          created_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: number;
          sync_type: string;
          status: string;
          products_synced: number;
          colors_synced: number;
          skus_synced: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: number;
          sync_type: string;
          status: string;
          products_synced?: number;
          colors_synced?: number;
          skus_synced?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: number;
          sync_type?: string;
          status?: string;
          products_synced?: number;
          colors_synced?: number;
          skus_synced?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      // Category System Tables
      categories: {
        Row: {
          id: number;
          name: string;
          type: 'main' | 'subcategory' | 'attribute' | 'guide';
          attribute_group: string | null;
          parent_id: number | null;
          slug: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          name: string;
          type: 'main' | 'subcategory' | 'attribute' | 'guide';
          attribute_group?: string | null;
          parent_id?: number | null;
          slug?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          type?: 'main' | 'subcategory' | 'attribute' | 'guide';
          attribute_group?: string | null;
          parent_id?: number | null;
          slug?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      attribute_groups: {
        Row: {
          id: string;
          display_name: string;
          display_order: number;
          applies_to: number[] | null;
          is_active: boolean;
        };
        Insert: {
          id: string;
          display_name: string;
          display_order?: number;
          applies_to?: number[] | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          display_name?: string;
          display_order?: number;
          applies_to?: number[] | null;
          is_active?: boolean;
        };
      };
      product_categories: {
        Row: {
          style_id: number;
          category_id: number;
        };
        Insert: {
          style_id: number;
          category_id: number;
        };
        Update: {
          style_id?: number;
          category_id?: number;
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

// Product Cache type aliases
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductColorRow = Database['public']['Tables']['product_colors']['Row'];
export type ProductColorInsert = Database['public']['Tables']['product_colors']['Insert'];
export type ProductSkuRow = Database['public']['Tables']['product_skus']['Row'];
export type ProductSkuInsert = Database['public']['Tables']['product_skus']['Insert'];
export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];
export type SyncLogInsert = Database['public']['Tables']['sync_logs']['Insert'];

// Category System type aliases
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type AttributeGroupRow = Database['public']['Tables']['attribute_groups']['Row'];
export type AttributeGroupInsert = Database['public']['Tables']['attribute_groups']['Insert'];
export type ProductCategoryRow = Database['public']['Tables']['product_categories']['Row'];
export type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert'];
