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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blogger_questionnaires: {
        Row: {
          activity_level: string | null
          additional_info: string | null
          age: number | null
          agreement_accepted: boolean | null
          audience_age: string | null
          audience_gender_male: number | null
          audience_geo: string | null
          avg_post_views: number | null
          avg_reels_views: number | null
          avg_shorts_views: number | null
          avg_stories_views: number | null
          avg_video_views: number | null
          best_video_url: string | null
          check_messages_frequency: string | null
          children_ages: string | null
          city: string | null
          completed: boolean | null
          completion_probability: number | null
          content_examples: string[] | null
          content_style: string[] | null
          content_types: string[] | null
          country: string | null
          created_at: string | null
          current_step: number | null
          custom_price: number | null
          deals_experience: string | null
          discipline_index: number | null
          does_photo: boolean | null
          does_video: boolean | null
          excluded_categories: string[] | null
          experience_results: string | null
          full_name: string | null
          had_delays: boolean | null
          has_children: boolean | null
          has_partner: boolean | null
          has_pvz_nearby: boolean | null
          id: string
          instagram_format: string | null
          max_product_price: number | null
          min_product_price: number | null
          moderation_note: string | null
          moderation_status: string
          motivation: string[] | null
          pickup_speed: string | null
          portfolio_photos: string[] | null
          portfolio_videos: string[] | null
          pricing_type: string | null
          products_per_month: string | null
          purchasing_power: string | null
          quality_index: number | null
          ready_for_photo_review: boolean | null
          ready_for_reminders: boolean | null
          ready_for_shorts: boolean | null
          ready_for_stages: boolean | null
          ready_for_tz: boolean | null
          ready_for_video_review: boolean | null
          ready_for_wb_review: boolean | null
          ready_to_buy: boolean | null
          reliability_index: number | null
          review_type: string | null
          sample_review: string | null
          self_quality: number | null
          self_reliability: number | null
          self_speed: number | null
          social_platforms: Json | null
          speed_days: number | null
          speed_index: number | null
          updated_at: string | null
          user_id: string
          views_trend: string | null
          work_style: string | null
          worked_marketplaces: string[] | null
        }
        Insert: {
          activity_level?: string | null
          additional_info?: string | null
          age?: number | null
          agreement_accepted?: boolean | null
          audience_age?: string | null
          audience_gender_male?: number | null
          audience_geo?: string | null
          avg_post_views?: number | null
          avg_reels_views?: number | null
          avg_shorts_views?: number | null
          avg_stories_views?: number | null
          avg_video_views?: number | null
          best_video_url?: string | null
          check_messages_frequency?: string | null
          children_ages?: string | null
          city?: string | null
          completed?: boolean | null
          completion_probability?: number | null
          content_examples?: string[] | null
          content_style?: string[] | null
          content_types?: string[] | null
          country?: string | null
          created_at?: string | null
          current_step?: number | null
          custom_price?: number | null
          deals_experience?: string | null
          discipline_index?: number | null
          does_photo?: boolean | null
          does_video?: boolean | null
          excluded_categories?: string[] | null
          experience_results?: string | null
          full_name?: string | null
          had_delays?: boolean | null
          has_children?: boolean | null
          has_partner?: boolean | null
          has_pvz_nearby?: boolean | null
          id?: string
          instagram_format?: string | null
          max_product_price?: number | null
          min_product_price?: number | null
          moderation_note?: string | null
          moderation_status?: string
          motivation?: string[] | null
          pickup_speed?: string | null
          portfolio_photos?: string[] | null
          portfolio_videos?: string[] | null
          pricing_type?: string | null
          products_per_month?: string | null
          purchasing_power?: string | null
          quality_index?: number | null
          ready_for_photo_review?: boolean | null
          ready_for_reminders?: boolean | null
          ready_for_shorts?: boolean | null
          ready_for_stages?: boolean | null
          ready_for_tz?: boolean | null
          ready_for_video_review?: boolean | null
          ready_for_wb_review?: boolean | null
          ready_to_buy?: boolean | null
          reliability_index?: number | null
          review_type?: string | null
          sample_review?: string | null
          self_quality?: number | null
          self_reliability?: number | null
          self_speed?: number | null
          social_platforms?: Json | null
          speed_days?: number | null
          speed_index?: number | null
          updated_at?: string | null
          user_id: string
          views_trend?: string | null
          work_style?: string | null
          worked_marketplaces?: string[] | null
        }
        Update: {
          activity_level?: string | null
          additional_info?: string | null
          age?: number | null
          agreement_accepted?: boolean | null
          audience_age?: string | null
          audience_gender_male?: number | null
          audience_geo?: string | null
          avg_post_views?: number | null
          avg_reels_views?: number | null
          avg_shorts_views?: number | null
          avg_stories_views?: number | null
          avg_video_views?: number | null
          best_video_url?: string | null
          check_messages_frequency?: string | null
          children_ages?: string | null
          city?: string | null
          completed?: boolean | null
          completion_probability?: number | null
          content_examples?: string[] | null
          content_style?: string[] | null
          content_types?: string[] | null
          country?: string | null
          created_at?: string | null
          current_step?: number | null
          custom_price?: number | null
          deals_experience?: string | null
          discipline_index?: number | null
          does_photo?: boolean | null
          does_video?: boolean | null
          excluded_categories?: string[] | null
          experience_results?: string | null
          full_name?: string | null
          had_delays?: boolean | null
          has_children?: boolean | null
          has_partner?: boolean | null
          has_pvz_nearby?: boolean | null
          id?: string
          instagram_format?: string | null
          max_product_price?: number | null
          min_product_price?: number | null
          moderation_note?: string | null
          moderation_status?: string
          motivation?: string[] | null
          pickup_speed?: string | null
          portfolio_photos?: string[] | null
          portfolio_videos?: string[] | null
          pricing_type?: string | null
          products_per_month?: string | null
          purchasing_power?: string | null
          quality_index?: number | null
          ready_for_photo_review?: boolean | null
          ready_for_reminders?: boolean | null
          ready_for_shorts?: boolean | null
          ready_for_stages?: boolean | null
          ready_for_tz?: boolean | null
          ready_for_video_review?: boolean | null
          ready_for_wb_review?: boolean | null
          ready_to_buy?: boolean | null
          reliability_index?: number | null
          review_type?: string | null
          sample_review?: string | null
          self_quality?: number | null
          self_reliability?: number | null
          self_speed?: number | null
          social_platforms?: Json | null
          speed_days?: number | null
          speed_index?: number | null
          updated_at?: string | null
          user_id?: string
          views_trend?: string | null
          work_style?: string | null
          worked_marketplaces?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "blogger_questionnaires_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deal_archives: {
        Row: {
          archived_at: string
          deal_id: string
          id: string
          user_id: string
        }
        Insert: {
          archived_at?: string
          deal_id: string
          id?: string
          user_id: string
        }
        Update: {
          archived_at?: string
          deal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_archives_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          deal_id: string
          id: string
          message: string | null
          message_type: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          deal_id: string
          id?: string
          message?: string | null
          message_type?: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          message?: string | null
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          blogger_id: string
          click_count: number | null
          content_status: string | null
          content_url: string | null
          created_at: string
          deadline_content: string | null
          deadline_final: string | null
          deadline_pickup: string | null
          deadline_review: string | null
          id: string
          initiated_by: string
          is_overdue: boolean | null
          order_number: string | null
          order_screenshot_url: string | null
          payment_amount: number | null
          payment_confirmed_at: string | null
          payment_details: Json | null
          payment_note: string | null
          payment_requested_at: string | null
          payment_screenshot_url: string | null
          payment_status: string | null
          pickup_proof_url: string | null
          product_id: string
          review_media_urls: string[] | null
          review_status: string | null
          review_text: string | null
          seller_id: string
          social_links: Json | null
          status: string
          status_history: Json | null
          tracking_token: string | null
          updated_at: string
          utm_url: string | null
          views_count: number | null
        }
        Insert: {
          blogger_id: string
          click_count?: number | null
          content_status?: string | null
          content_url?: string | null
          created_at?: string
          deadline_content?: string | null
          deadline_final?: string | null
          deadline_pickup?: string | null
          deadline_review?: string | null
          id?: string
          initiated_by?: string
          is_overdue?: boolean | null
          order_number?: string | null
          order_screenshot_url?: string | null
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_details?: Json | null
          payment_note?: string | null
          payment_requested_at?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          pickup_proof_url?: string | null
          product_id: string
          review_media_urls?: string[] | null
          review_status?: string | null
          review_text?: string | null
          seller_id: string
          social_links?: Json | null
          status?: string
          status_history?: Json | null
          tracking_token?: string | null
          updated_at?: string
          utm_url?: string | null
          views_count?: number | null
        }
        Update: {
          blogger_id?: string
          click_count?: number | null
          content_status?: string | null
          content_url?: string | null
          created_at?: string
          deadline_content?: string | null
          deadline_final?: string | null
          deadline_pickup?: string | null
          deadline_review?: string | null
          id?: string
          initiated_by?: string
          is_overdue?: boolean | null
          order_number?: string | null
          order_screenshot_url?: string | null
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_details?: Json | null
          payment_note?: string | null
          payment_requested_at?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          pickup_proof_url?: string | null
          product_id?: string
          review_media_urls?: string[] | null
          review_status?: string | null
          review_text?: string | null
          seller_id?: string
          social_links?: Json | null
          status?: string
          status_history?: Json | null
          tracking_token?: string | null
          updated_at?: string
          utm_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_blogger_id_fkey"
            columns: ["blogger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          deadline_days: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          marketplace_url: string | null
          min_views: number | null
          name: string
          requirements: string | null
          seller_id: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          min_views?: number | null
          name: string
          requirements?: string | null
          seller_id: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          marketplace_url?: string | null
          min_views?: number | null
          name?: string
          requirements?: string | null
          seller_id?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          content_formats: string[] | null
          created_at: string
          id: string
          is_blocked: boolean
          name: string
          niche: string | null
          platforms: Json | null
          role: Database["public"]["Enums"]["app_role"]
          subscribers_count: number | null
          telegram_chat_id: number | null
          telegram_id: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          content_formats?: string[] | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          name?: string
          niche?: string | null
          platforms?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          subscribers_count?: number | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          content_formats?: string[] | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          name?: string
          niche?: string | null
          platforms?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          subscribers_count?: number | null
          telegram_chat_id?: number | null
          telegram_id?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          rating: number
          reviewer_id: string
          target_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          rating: number
          reviewer_id: string
          target_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          rating?: number
          reviewer_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      telegram_auth_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          role: string
          telegram_chat_id: number
          telegram_first_name: string | null
          telegram_username: string | null
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          role?: string
          telegram_chat_id: number
          telegram_first_name?: string | null
          telegram_username?: string | null
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          role?: string
          telegram_chat_id?: number
          telegram_first_name?: string | null
          telegram_username?: string | null
          used?: boolean
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      tracking_clicks: {
        Row: {
          clicked_at: string
          deal_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          deal_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          deal_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_clicks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "blogger" | "seller"
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
      app_role: ["admin", "blogger", "seller"],
    },
  },
} as const
