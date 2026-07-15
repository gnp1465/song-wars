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
      rooms: {
        Row: {
          id: string;
          code: string | null;
          host_user_id: string;
          status: "lobby" | "in_round" | "closed" | "expired";
          mode: "single_speaker" | "remote";
          songs_per_player: number;
          points_to_win: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          code?: string | null;
          host_user_id: string;
          status?: "lobby" | "in_round" | "closed" | "expired";
          mode?: "single_speaker" | "remote";
          songs_per_player?: number;
          points_to_win?: number;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          code?: string | null;
          host_user_id?: string;
          status?: "lobby" | "in_round" | "closed" | "expired";
          mode?: "single_speaker" | "remote";
          songs_per_player?: number;
          points_to_win?: number;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          role: "host" | "guest";
          join_order: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          role: "host" | "guest";
          join_order: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          role?: "host" | "guest";
          join_order?: number;
          joined_at?: string;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          judge_member_id: string;
          status: "waiting_for_topic";
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_number: number;
          judge_member_id: string;
          status?: "waiting_for_topic";
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_number?: number;
          judge_member_id?: string;
          status?: "waiting_for_topic";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_room: {
        Args: {
          host_display_name: string;
          room_mode: "single_speaker" | "remote";
          songs_per_player_value: number;
          points_to_win_value: number;
        };
        Returns: Json;
      };
      join_room: {
        Args: {
          room_code: string;
          guest_display_name: string;
        };
        Returns: Json;
      };
      leave_room: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      remove_room_member: {
        Args: {
          room_id_value: string;
          member_id_value: string;
        };
        Returns: Json;
      };
      update_room_settings: {
        Args: {
          room_id_value: string;
          room_mode: "single_speaker" | "remote" | null;
          songs_per_player_value: number | null;
          points_to_win_value: number | null;
        };
        Returns: Json;
      };
      start_room: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      close_room: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      get_room_snapshot: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
