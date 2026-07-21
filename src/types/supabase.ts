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
          status: "lobby" | "in_round" | "complete" | "closed" | "expired";
          mode: "single_speaker" | "remote";
          songs_per_player: number;
          points_to_win: number;
          created_at: string;
          expires_at: string;
          game_winner_member_id: string | null;
        };
        Insert: {
          id?: string;
          code?: string | null;
          host_user_id: string;
          status?: "lobby" | "in_round" | "complete" | "closed" | "expired";
          mode?: "single_speaker" | "remote";
          songs_per_player?: number;
          points_to_win?: number;
          created_at?: string;
          expires_at?: string;
          game_winner_member_id?: string | null;
        };
        Update: {
          id?: string;
          code?: string | null;
          host_user_id?: string;
          status?: "lobby" | "in_round" | "complete" | "closed" | "expired";
          mode?: "single_speaker" | "remote";
          songs_per_player?: number;
          points_to_win?: number;
          created_at?: string;
          expires_at?: string;
          game_winner_member_id?: string | null;
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
          status: "waiting_for_topic" | "submitting" | "judging" | "complete";
          topic: string | null;
          winning_submission_id: string | null;
          winning_member_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_number: number;
          judge_member_id: string;
          status?: "waiting_for_topic" | "submitting" | "judging" | "complete";
          topic?: string | null;
          winning_submission_id?: string | null;
          winning_member_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_number?: number;
          judge_member_id?: string;
          status?: "waiting_for_topic" | "submitting" | "judging" | "complete";
          topic?: string | null;
          winning_submission_id?: string | null;
          winning_member_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      round_submissions: {
        Row: {
          id: string;
          room_id: string;
          round_id: string;
          member_id: string;
          song_key: string;
          track_id: string;
          title: string;
          artists: string[];
          album_name: string | null;
          artwork_url: string | null;
          preview_url: string | null;
          provider_refs: Json;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_id: string;
          member_id: string;
          song_key: string;
          track_id: string;
          title: string;
          artists?: string[];
          album_name?: string | null;
          artwork_url?: string | null;
          preview_url?: string | null;
          provider_refs?: Json;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_id?: string;
          member_id?: string;
          song_key?: string;
          track_id?: string;
          title?: string;
          artists?: string[];
          album_name?: string | null;
          artwork_url?: string | null;
          preview_url?: string | null;
          provider_refs?: Json;
          submitted_at?: string;
        };
        Relationships: [];
      };
      room_scores: {
        Row: {
          room_id: string;
          member_id: string;
          points: number;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          member_id: string;
          points?: number;
          updated_at?: string;
        };
        Update: {
          room_id?: string;
          member_id?: string;
          points?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      round_matchups: {
        Row: {
          id: string;
          room_id: string;
          round_id: string;
          bracket_round_number: number;
          position: number;
          status: "pending" | "ready" | "complete";
          left_submission_id: string | null;
          right_submission_id: string | null;
          winner_submission_id: string | null;
          has_bye: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_id: string;
          bracket_round_number: number;
          position: number;
          status?: "pending" | "ready" | "complete";
          left_submission_id?: string | null;
          right_submission_id?: string | null;
          winner_submission_id?: string | null;
          has_bye?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_id?: string;
          bracket_round_number?: number;
          position?: number;
          status?: "pending" | "ready" | "complete";
          left_submission_id?: string | null;
          right_submission_id?: string | null;
          winner_submission_id?: string | null;
          has_bye?: boolean;
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
      submit_round_topic: {
        Args: {
          room_id_value: string;
          topic_value: string;
        };
        Returns: Json;
      };
      submit_round_song: {
        Args: {
          room_id_value: string;
          track_id_value: string;
          title_value: string;
          artists_value: string[];
          album_name_value: string | null;
          artwork_url_value: string | null;
          preview_url_value: string | null;
          provider_refs_value: Json;
        };
        Returns: Json;
      };
      remove_own_submission: {
        Args: {
          room_id_value: string;
          submission_id_value: string;
        };
        Returns: Json;
      };
      create_round_bracket: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      select_matchup_winner: {
        Args: {
          room_id_value: string;
          matchup_id_value: string;
          winner_submission_id_value: string;
        };
        Returns: Json;
      };
      complete_round: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      prepare_next_round: {
        Args: {
          room_id_value: string;
        };
        Returns: Json;
      };
      complete_game: {
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
