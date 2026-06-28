export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          email: string
          points_balance: number
          total_completions: number
          daily_completions: number
          last_daily_reset: string
          total_wpm_sum: number
          total_accuracy_sum: number
          is_admin: boolean
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          email: string
          points_balance?: number
          total_completions?: number
          daily_completions?: number
          last_daily_reset?: string
          total_wpm_sum?: number
          total_accuracy_sum?: number
          is_admin?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          brand_name: string
          ad_text: string
          image_url: string | null
          points_reward: number
          completion_cap: number
          completions_count: number
          estimated_time_seconds: number | null
          is_active: boolean
          tile_color: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      typing_sessions: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          wpm: number
          accuracy: number
          keystrokes_data: Json | null
          accuracy_samples: Json | null
          total_keystrokes: number
          correct_keystrokes: number
          duration_seconds: number | null
          status: 'completed' | 'abandoned' | 'flagged'
          is_flagged: boolean
          flag_reason: string | null
          points_earned: number
          test_mode: string | null
          time_limit: number | null
          use_punctuation: boolean | null
          use_lowercase: boolean | null
          completed_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['typing_sessions']['Row'], 'created_at'> & {
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['typing_sessions']['Insert']>
      }
      redemption_requests: {
        Row: {
          id: string
          user_id: string
          gift_card_type: string
          denomination: number
          points_cost: number
          status: 'pending' | 'fulfilled' | 'rejected'
          gift_card_code: string | null
          admin_notes: string | null
          requested_at: string
          fulfilled_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['redemption_requests']['Row'], 'requested_at'> & {
          requested_at?: string
        }
        Update: Partial<Database['public']['Tables']['redemption_requests']['Insert']>
      }
      points_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'earned' | 'redeemed'
          amount: number
          reference_id: string | null
          description: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['points_transactions']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['points_transactions']['Insert']>
      }
      gift_card_options: {
        Row: {
          id: string
          name: string
          slug: string
          denominations: number[]
          is_active: boolean
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['gift_card_options']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['gift_card_options']['Insert']>
      }
    }
    Views: {
      leaderboard: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          points_balance: number
          total_completions: number
          avg_wpm: number
          avg_accuracy: number
          created_at: string
          rank: number
        }
      }
    }
    Functions: {
      complete_session: {
        Args: {
          p_session_id: string
          p_user_id: string
          p_campaign_id: string
          p_wpm: number
          p_accuracy: number
          p_keystrokes_data: Json
          p_accuracy_samples: Json
          p_total_keystrokes: number
          p_correct_keystrokes: number
          p_duration_seconds: number
          p_test_mode?: string
          p_time_limit?: number | null
          p_use_punctuation?: boolean
          p_use_lowercase?: boolean
        }
        Returns: Json
      }
      request_redemption: {
        Args: {
          p_user_id: string
          p_gift_card_type: string
          p_denomination: number
          p_points_cost: number
        }
        Returns: Json
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type TypingSession = Database['public']['Tables']['typing_sessions']['Row']
export type RedemptionRequest = Database['public']['Tables']['redemption_requests']['Row']
export type PointsTransaction = Database['public']['Tables']['points_transactions']['Row']
export type GiftCardOption = Database['public']['Tables']['gift_card_options']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']
