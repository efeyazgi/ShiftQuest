export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows createClient to infer the PostgREST version from generated types.
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      game_saves: {
        Row: {
          created_at: string;
          revision: number;
          schema_version: number;
          state: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          revision?: number;
          schema_version?: number;
          state?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          revision?: number;
          schema_version?: number;
          state?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      social_profiles: {
        Row: {
          achievement_count_opt_in: boolean;
          career_level: string;
          created_at: string;
          display_name: string;
          industry: string;
          leaderboard_opt_in: boolean;
          professional_role: string;
          profile_visibility: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achievement_count_opt_in?: boolean;
          career_level: string;
          created_at?: string;
          display_name: string;
          industry: string;
          leaderboard_opt_in?: boolean;
          professional_role: string;
          profile_visibility?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achievement_count_opt_in?: boolean;
          career_level?: string;
          created_at?: string;
          display_name?: string;
          industry?: string;
          leaderboard_opt_in?: boolean;
          professional_role?: string;
          profile_visibility?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          accepted_at: string;
          created_at: string;
          id: string;
          user_a: string;
          user_b: string;
        };
        Insert: {
          accepted_at?: string;
          created_at?: string;
          id?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          accepted_at?: string;
          created_at?: string;
          id?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [];
      };
      social_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friend_invites: {
        Row: {
          accepted_by: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          inviter_id: string;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          accepted_by?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          inviter_id: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          inviter_id?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      verified_scenario_completions: {
        Row: {
          accuracy: number;
          category: string;
          is_boss: boolean;
          roleplay_completed: boolean;
          scenario_id: string;
          user_id: string;
          verified_at: string;
          verified_xp: number;
        };
        Insert: {
          accuracy: number;
          category: string;
          is_boss: boolean;
          roleplay_completed: boolean;
          scenario_id: string;
          user_id: string;
          verified_at?: string;
          verified_xp: number;
        };
        Update: {
          accuracy?: number;
          category?: string;
          is_boss?: boolean;
          roleplay_completed?: boolean;
          scenario_id?: string;
          user_id?: string;
          verified_at?: string;
          verified_xp?: number;
        };
        Relationships: [];
      };
      verified_progress: {
        Row: {
          completed_scenarios: number;
          updated_at: string;
          user_id: string;
          verified_xp: number;
        };
        Insert: {
          completed_scenarios?: number;
          updated_at?: string;
          user_id: string;
          verified_xp?: number;
        };
        Update: {
          completed_scenarios?: number;
          updated_at?: string;
          user_id?: string;
          verified_xp?: number;
        };
        Relationships: [];
      };
      verified_achievement_counts: {
        Row: {
          updated_at: string;
          user_id: string;
          verified_achievement_count: number;
        };
        Insert: {
          updated_at?: string;
          user_id: string;
          verified_achievement_count?: number;
        };
        Update: {
          updated_at?: string;
          user_id?: string;
          verified_achievement_count?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_friend_invite: {
        Args: { accepting_user_id: string; invite_token_hash: string };
        Returns: string;
      };
      record_verified_completion: {
        Args: {
          completion_accuracy: number;
          completion_category: string;
          completion_is_boss: boolean;
          completion_roleplay_completed: boolean;
          completion_scenario_id: string;
          completion_user_id: string;
          completion_verified_xp: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
