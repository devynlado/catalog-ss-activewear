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
          customer_id: string | null;
          assigned_sales_rep_id: string | null;
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
          customer_id?: string | null;
          assigned_sales_rep_id?: string | null;
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
          customer_id?: string | null;
          assigned_sales_rep_id?: string | null;
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
          status: 'new' | 'contacted' | 'resolved' | 'spam';
          source: string | null;
          variant: string | null;
          quantity: string | null;
          visitor_source: string | null;
          is_spam: boolean;
          blocked_at: string | null;
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
          status?: 'new' | 'contacted' | 'resolved' | 'spam';
          source?: string | null;
          variant?: string | null;
          quantity?: string | null;
          visitor_source?: string | null;
          is_spam?: boolean;
          blocked_at?: string | null;
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
          status?: 'new' | 'contacted' | 'resolved' | 'spam';
          source?: string | null;
          variant?: string | null;
          quantity?: string | null;
          visitor_source?: string | null;
          is_spam?: boolean;
          blocked_at?: string | null;
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
      // User Profiles Table
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'customer' | 'sales_rep' | 'admin';
          phone: string | null;
          company: string | null;
          assigned_sales_rep_id: string | null;
          calendly_url: string | null;
          notification_preferences: Json | null;
          // Customer type & verification
          customer_type: 'direct' | 'distributor';
          verification_status: 'pending' | 'approved' | 'denied' | null;
          verified_at: string | null;
          verified_by: string | null;
          verification_notes: string | null;
          // Industry credentials
          asi_number: string | null;
          ppai_number: string | null;
          business_type: string | null;
          // Website & Address
          website: string | null;
          billing_address_street: string | null;
          billing_address_city: string | null;
          billing_address_state: string | null;
          billing_address_zip: string | null;
          // Business Licenses
          business_license: string | null;
          sellers_permit: string | null;
          // Tax & Compliance
          tax_exempt: boolean;
          resale_certificate: string | null;
          resale_certificate_expiry: string | null;
          tax_id: string | null;
          // Pricing tier
          pricing_tier: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'sales_rep' | 'admin';
          phone?: string | null;
          company?: string | null;
          assigned_sales_rep_id?: string | null;
          calendly_url?: string | null;
          notification_preferences?: Json | null;
          customer_type?: 'direct' | 'distributor';
          verification_status?: 'pending' | 'approved' | 'denied' | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_notes?: string | null;
          asi_number?: string | null;
          ppai_number?: string | null;
          business_type?: string | null;
          website?: string | null;
          billing_address_street?: string | null;
          billing_address_city?: string | null;
          billing_address_state?: string | null;
          billing_address_zip?: string | null;
          business_license?: string | null;
          sellers_permit?: string | null;
          tax_exempt?: boolean;
          resale_certificate?: string | null;
          resale_certificate_expiry?: string | null;
          tax_id?: string | null;
          pricing_tier?: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'sales_rep' | 'admin';
          phone?: string | null;
          company?: string | null;
          assigned_sales_rep_id?: string | null;
          calendly_url?: string | null;
          notification_preferences?: Json | null;
          customer_type?: 'direct' | 'distributor';
          verification_status?: 'pending' | 'approved' | 'denied' | null;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_notes?: string | null;
          asi_number?: string | null;
          ppai_number?: string | null;
          business_type?: string | null;
          website?: string | null;
          billing_address_street?: string | null;
          billing_address_city?: string | null;
          billing_address_state?: string | null;
          billing_address_zip?: string | null;
          business_license?: string | null;
          sellers_permit?: string | null;
          tax_exempt?: boolean;
          resale_certificate?: string | null;
          resale_certificate_expiry?: string | null;
          tax_id?: string | null;
          pricing_tier?: 'standard' | 'bronze' | 'silver' | 'gold' | 'platinum';
          created_at?: string;
          updated_at?: string;
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
          meta_description: string | null;
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
          avg_rating: number | null;
          review_count: number;
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
          meta_description?: string | null;
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
          avg_rating?: number | null;
          review_count?: number;
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
          meta_description?: string | null;
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
          avg_rating?: number | null;
          review_count?: number;
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
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          customer_email: string;
          customer_name: string | null;
          customer_phone: string | null;
          company: string | null;
          quote_id: string | null;
          items: Json;
          subtotal: number;
          shipping_cost: number;
          tax_amount: number;
          discount_amount: number;
          total: number;
          coupon_id: string | null;
          coupon_code: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          payment_method: 'card' | 'ach' | 'invoice' | null;
          payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          po_number: string | null;
          paid_at: string | null;
          status: 'pending' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number: string | null;
          carrier: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          risk_score: number | null;
          expected_delivery_date: string | null;
          ss_auto_order_failed: boolean;
          ss_auto_order_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id?: string | null;
          customer_email: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          company?: string | null;
          quote_id?: string | null;
          items: Json;
          subtotal: number;
          shipping_cost?: number;
          tax_amount?: number;
          discount_amount?: number;
          total: number;
          coupon_id?: string | null;
          coupon_code?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          payment_method?: 'card' | 'ach' | 'invoice' | null;
          payment_status?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          po_number?: string | null;
          paid_at?: string | null;
          status?: 'pending' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number?: string | null;
          carrier?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          risk_score?: number | null;
          expected_delivery_date?: string | null;
          ss_auto_order_failed?: boolean;
          ss_auto_order_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          customer_email?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          company?: string | null;
          quote_id?: string | null;
          items?: Json;
          subtotal?: number;
          shipping_cost?: number;
          tax_amount?: number;
          discount_amount?: number;
          total?: number;
          coupon_id?: string | null;
          coupon_code?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          payment_method?: 'card' | 'ach' | 'invoice' | null;
          payment_status?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          po_number?: string | null;
          paid_at?: string | null;
          status?: 'pending' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number?: string | null;
          carrier?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          risk_score?: number | null;
          expected_delivery_date?: string | null;
          ss_auto_order_failed?: boolean;
          ss_auto_order_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: 'percent_cart' | 'fixed_cart' | 'free_shipping';
          amount: number;
          free_shipping: boolean;
          min_cart_amount: number | null;
          max_discount_amount: number | null;
          applies_to: 'cart_and_packages' | 'products_only';
          starts_at: string | null;
          expires_at: string | null;
          usage_limit: number | null;
          used_count: number;
          usage_limit_per_customer: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: 'percent_cart' | 'fixed_cart' | 'free_shipping';
          amount?: number;
          free_shipping?: boolean;
          min_cart_amount?: number | null;
          max_discount_amount?: number | null;
          applies_to?: 'cart_and_packages' | 'products_only';
          starts_at?: string | null;
          expires_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          usage_limit_per_customer?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: 'percent_cart' | 'fixed_cart' | 'free_shipping';
          amount?: number;
          free_shipping?: boolean;
          min_cart_amount?: number | null;
          max_discount_amount?: number | null;
          applies_to?: 'cart_and_packages' | 'products_only';
          starts_at?: string | null;
          expires_at?: string | null;
          usage_limit?: number | null;
          used_count?: number;
          usage_limit_per_customer?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          currency: string;
          type: 'charge' | 'refund';
          status: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          stripe_refund_id: string | null;
          failure_code: string | null;
          failure_message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          currency?: string;
          type: 'charge' | 'refund';
          status: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          stripe_refund_id?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          currency?: string;
          type?: 'charge' | 'refund';
          status?: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          stripe_refund_id?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      order_activities: {
        Row: {
          id: string;
          order_id: string;
          user_id: string | null;
          activity_type: 'created' | 'payment_processing' | 'payment_received' | 'payment_failed' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'status_change' | 'shipped' | 'delivered' | 'refunded' | 'note' | 'cancelled' | 'email_sent' | 'system_error';
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id?: string | null;
          activity_type: 'created' | 'payment_processing' | 'payment_received' | 'payment_failed' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'status_change' | 'shipped' | 'delivered' | 'refunded' | 'note' | 'cancelled' | 'email_sent' | 'system_error';
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string | null;
          activity_type?: 'created' | 'payment_processing' | 'payment_received' | 'payment_failed' | 'confirmed' | 'awaiting_purchasing' | 'ordered' | 'status_change' | 'shipped' | 'delivered' | 'refunded' | 'note' | 'cancelled' | 'email_sent' | 'system_error';
          details?: Json;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          style_id: number;
          order_id: string;
          order_item_id: string | null;
          customer_email: string;
          customer_name: string | null;
          rating: number;
          title: string | null;
          body: string;
          photos: Json;
          status: 'pending' | 'approved' | 'rejected';
          verified_purchase: boolean;
          reward_coupon_id: string | null;
          admin_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          style_id: number;
          order_id: string;
          order_item_id?: string | null;
          customer_email: string;
          customer_name?: string | null;
          rating: number;
          title?: string | null;
          body: string;
          photos?: Json;
          status?: 'pending' | 'approved' | 'rejected';
          verified_purchase?: boolean;
          reward_coupon_id?: string | null;
          admin_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          style_id?: number;
          order_id?: string;
          order_item_id?: string | null;
          customer_email?: string;
          customer_name?: string | null;
          rating?: number;
          title?: string | null;
          body?: string;
          photos?: Json;
          status?: 'pending' | 'approved' | 'rejected';
          verified_purchase?: boolean;
          reward_coupon_id?: string | null;
          admin_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      review_invites: {
        Row: {
          id: string;
          order_id: string;
          customer_email: string;
          customer_name: string | null;
          token: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_email: string;
          customer_name?: string | null;
          token?: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_email?: string;
          customer_name?: string | null;
          token?: string;
          sent_at?: string;
        };
      };
      // SS Activewear Order Tracking
      ss_orders: {
        Row: {
          id: string;
          order_id: string;
          shipment_id: string | null;
          ss_order_number: string;
          ss_invoice_number: string | null;
          ss_guid: string;
          ss_warehouse: string | null;
          ss_order_status: string | null;
          ss_delivery_status: string | null;
          ss_expected_delivery_date: string | null;
          ss_ship_date: string | null;
          ss_tracking_number: string | null;
          ss_carrier: string | null;
          ss_subtotal: number | null;
          ss_shipping: number | null;
          ss_total: number | null;
          ss_total_weight: number | null;
          ss_total_boxes: number | null;
          ss_raw_response: Json | null;
          line_errors: Json | null;
          placed_at: string;
          last_polled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          shipment_id?: string | null;
          ss_order_number: string;
          ss_invoice_number?: string | null;
          ss_guid: string;
          ss_warehouse?: string | null;
          ss_order_status?: string | null;
          ss_delivery_status?: string | null;
          ss_expected_delivery_date?: string | null;
          ss_ship_date?: string | null;
          ss_tracking_number?: string | null;
          ss_carrier?: string | null;
          ss_subtotal?: number | null;
          ss_shipping?: number | null;
          ss_total?: number | null;
          ss_total_weight?: number | null;
          ss_total_boxes?: number | null;
          ss_raw_response?: Json | null;
          line_errors?: Json | null;
          placed_at?: string;
          last_polled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          shipment_id?: string | null;
          ss_order_number?: string;
          ss_invoice_number?: string | null;
          ss_guid?: string;
          ss_warehouse?: string | null;
          ss_order_status?: string | null;
          ss_delivery_status?: string | null;
          ss_expected_delivery_date?: string | null;
          ss_ship_date?: string | null;
          ss_tracking_number?: string | null;
          ss_carrier?: string | null;
          ss_subtotal?: number | null;
          ss_shipping?: number | null;
          ss_total?: number | null;
          ss_total_weight?: number | null;
          ss_total_boxes?: number | null;
          ss_raw_response?: Json | null;
          line_errors?: Json | null;
          placed_at?: string;
          last_polled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ss_tracking_events: {
        Row: {
          id: string;
          ss_order_id: string;
          tracking_number: string;
          carrier: string | null;
          checkpoint_date: string | null;
          checkpoint_location: string | null;
          checkpoint_status: string | null;
          actual_delivery_date: string | null;
          signed_by: string | null;
          raw_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ss_order_id: string;
          tracking_number: string;
          carrier?: string | null;
          checkpoint_date?: string | null;
          checkpoint_location?: string | null;
          checkpoint_status?: string | null;
          actual_delivery_date?: string | null;
          signed_by?: string | null;
          raw_response?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ss_order_id?: string;
          tracking_number?: string;
          carrier?: string | null;
          checkpoint_date?: string | null;
          checkpoint_location?: string | null;
          checkpoint_status?: string | null;
          actual_delivery_date?: string | null;
          signed_by?: string | null;
          raw_response?: Json | null;
          created_at?: string;
        };
      };
      ss_activity_log: {
        Row: {
          id: string;
          order_id: string;
          ss_order_id: string | null;
          activity_type: string;
          status: string;
          title: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          ss_order_id?: string | null;
          activity_type: string;
          status?: string;
          title: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          ss_order_id?: string | null;
          activity_type?: string;
          status?: string;
          title?: string;
          details?: Json;
          created_at?: string;
        };
      };
      ss_returns: {
        Row: {
          id: string;
          order_id: string;
          ss_order_id: string | null;
          ss_return_number: string | null;
          ss_rma_number: string | null;
          status: string;
          reason: string | null;
          items: Json | null;
          ss_raw_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          ss_order_id?: string | null;
          ss_return_number?: string | null;
          ss_rma_number?: string | null;
          status?: string;
          reason?: string | null;
          items?: Json | null;
          ss_raw_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          ss_order_id?: string | null;
          ss_return_number?: string | null;
          ss_rma_number?: string | null;
          status?: string;
          reason?: string | null;
          items?: Json | null;
          ss_raw_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      delivery_estimates_cache: {
        Row: {
          id: string;
          zip_code: string;
          warehouse_abbr: string;
          days_in_transit: number;
          cutoff_time: string;
          cached_at: string;
        };
        Insert: {
          id?: string;
          zip_code: string;
          warehouse_abbr: string;
          days_in_transit: number;
          cutoff_time: string;
          cached_at?: string;
        };
        Update: {
          id?: string;
          zip_code?: string;
          warehouse_abbr?: string;
          days_in_transit?: number;
          cutoff_time?: string;
          cached_at?: string;
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

// Order System type aliases
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type OrderActivity = Database['public']['Tables']['order_activities']['Row'];
export type OrderActivityInsert = Database['public']['Tables']['order_activities']['Insert'];

// Review System type aliases
export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];
export type ReviewInviteRow = Database['public']['Tables']['review_invites']['Row'];
export type ReviewInviteInsert = Database['public']['Tables']['review_invites']['Insert'];

// SS Activewear Order type aliases
export type SSOrderRow = Database['public']['Tables']['ss_orders']['Row'];
export type SSOrderInsert = Database['public']['Tables']['ss_orders']['Insert'];
export type SSOrderUpdate = Database['public']['Tables']['ss_orders']['Update'];
export type SSTrackingEventRow = Database['public']['Tables']['ss_tracking_events']['Row'];
export type SSTrackingEventInsert = Database['public']['Tables']['ss_tracking_events']['Insert'];
export type SSActivityLogRow = Database['public']['Tables']['ss_activity_log']['Row'];
export type SSActivityLogInsert = Database['public']['Tables']['ss_activity_log']['Insert'];
export type SSReturnRow = Database['public']['Tables']['ss_returns']['Row'];
export type SSReturnInsert = Database['public']['Tables']['ss_returns']['Insert'];
export type DeliveryEstimateCacheRow = Database['public']['Tables']['delivery_estimates_cache']['Row'];

// Available size info for cart (used to show all sizes in cart/drawer)
export interface AvailableSize {
  name: string;
  code: string;
  price: number;
  inStock: boolean;
}

// Cart item type (for cart store)
export interface CartItem {
  id: string;
  sku: string;
  styleId: number;
  styleName: string;  // Style number (e.g., "202")
  productTitle?: string;  // Full product name (e.g., "Unisex Fine Jersey T-Shirt")
  brandName: string;
  colorName: string;
  colorCode: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  /** When set, cart/checkout use this unit price (bypasses volume tiers) */
  overrideUnitPrice?: number;
  discountedPrice?: number;  // Google automated discount price
  discountSource?: 'google';  // Track discount origin
  imageUrl?: string;
  availableSizes?: AvailableSize[];  // All sizes available for this style/color
  warehouse?: 'ss_activewear' | 'los_angeles_apparel' | 'as_colour';
}

// Order shipment tracking (matches order_shipments table)
export interface OrderShipment {
  id: string;
  order_id: string;
  shipment_index: number;
  warehouse: string;
  shipping_method: string | null;
  shipping_cost: number;
  actual_shipping_cost: number | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items: unknown;
  ss_order_number: string | null;
  ss_invoice_number: string | null;
  ss_guid: string | null;
  expected_delivery_date: string | null;
  delivery_status: string | null;
  last_checkpoint_location: string | null;
  last_checkpoint_message: string | null;
  last_checkpoint_at: string | null;
  created_at: string;
  updated_at: string;
}

// Shipping address type
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}
