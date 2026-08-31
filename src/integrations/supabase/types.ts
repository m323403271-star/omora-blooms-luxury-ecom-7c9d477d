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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          items: Json
          recovered: boolean
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          items?: Json
          recovered?: boolean
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          items?: Json
          recovered?: boolean
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_value: number
          updated_at: string
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          payment_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          payment_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          payment_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          code: string
          commission_rate: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          partner_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          commission_rate?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          partner_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          commission_rate?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          partner_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          balance_due: number
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tier: string
          delivery_notes: string | null
          discount_amount: number
          error_message: string | null
          id: string
          items: Json
          order_total: number | null
          payment_mode: string
          pickup_point_id: string | null
          pincode: string | null
          preview_channel: string | null
          preview_photo_url: string | null
          preview_sent_at: string | null
          priority: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          ref_code: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_due?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tier?: string
          delivery_notes?: string | null
          discount_amount?: number
          error_message?: string | null
          id?: string
          items?: Json
          order_total?: number | null
          payment_mode?: string
          pickup_point_id?: string | null
          pincode?: string | null
          preview_channel?: string | null
          preview_photo_url?: string | null
          preview_sent_at?: string | null
          priority?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          ref_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_due?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tier?: string
          delivery_notes?: string | null
          discount_amount?: number
          error_message?: string | null
          id?: string
          items?: Json
          order_total?: number | null
          payment_mode?: string
          pickup_point_id?: string | null
          pincode?: string | null
          preview_channel?: string | null
          preview_photo_url?: string | null
          preview_sent_at?: string | null
          priority?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          ref_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean
          color_hex: string
          color_name: string
          created_at: string
          description: string | null
          id: string
          images: string[]
          name: string
          packaging_video_url: string | null
          price: number
          product_id: string
          product_video_url: string | null
          slug: string
          sort_order: number
          stock: number
          track_stock: boolean
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          color_hex?: string
          color_name?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          packaging_video_url?: string | null
          price?: number
          product_id: string
          product_video_url?: string | null
          slug: string
          sort_order?: number
          stock?: number
          track_stock?: boolean
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          color_hex?: string
          color_name?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          packaging_video_url?: string | null
          price?: number
          product_id?: string
          product_video_url?: string | null
          slug?: string
          sort_order?: number
          stock?: number
          track_stock?: boolean
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean
          category: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string
          images: string[]
          is_bestseller: boolean
          is_new_launch: boolean
          is_trending: boolean
          name: string
          packaging_video_url: string | null
          price: number
          product_video_url: string | null
          slug: string
          sort_order: number
          tagline: string | null
          tags: string[] | null
        }
        Insert: {
          available?: boolean
          category: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url: string
          images?: string[]
          is_bestseller?: boolean
          is_new_launch?: boolean
          is_trending?: boolean
          name: string
          packaging_video_url?: string | null
          price?: number
          product_video_url?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          tags?: string[] | null
        }
        Update: {
          available?: boolean
          category?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          images?: string[]
          is_bestseller?: boolean
          is_new_launch?: boolean
          is_trending?: boolean
          name?: string
          packaging_video_url?: string | null
          price?: number
          product_video_url?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      referred_orders: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          customer_note: string | null
          id: string
          items: Json
          partner_code: string
          partner_id: string
          status: string
          total: number
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customer_note?: string | null
          id?: string
          items?: Json
          partner_code: string
          partner_id: string
          status?: string
          total?: number
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customer_note?: string | null
          id?: string
          items?: Json
          partner_code?: string
          partner_id?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "referred_orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          author_name: string
          body: string
          created_at: string
          id: string
          media: Json
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string | null
          verified_buyer: boolean
        }
        Insert: {
          approved?: boolean
          author_name: string
          body: string
          created_at?: string
          id?: string
          media?: Json
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_buyer?: boolean
        }
        Update: {
          approved?: boolean
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          media?: Json
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_buyer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_codes: {
        Row: {
          code: string
          created_at: string
          discount_inr: number
          expires_at: string
          id: string
          payment_id: string | null
          points_cost: number
          status: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_inr: number
          expires_at?: string
          id?: string
          payment_id?: string | null
          points_cost: number
          status?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_inr?: number
          expires_at?: string
          id?: string
          payment_id?: string | null
          points_cost?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_codes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_images: {
        Row: {
          category_name: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          page_type: string
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          page_type: string
        }
        Update: {
          category_name?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          page_type?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          default_commission_rate: number
          id: boolean
          razorpay_enabled: boolean
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          default_commission_rate?: number
          id?: boolean
          razorpay_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          default_commission_rate?: number
          id?: boolean
          razorpay_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      tryon_usage: {
        Row: {
          created_at: string
          trial_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          trial_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          trial_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_tryon_trial: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_referred_order: {
        Args: { _items: Json; _partner_code: string }
        Returns: string
      }
      lookup_partner: {
        Args: { _code: string }
        Returns: {
          code: string
          commission_rate: number
          id: string
        }[]
      }
      loyalty_balance: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "partner"
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
      app_role: ["admin", "partner"],
    },
  },
} as const
