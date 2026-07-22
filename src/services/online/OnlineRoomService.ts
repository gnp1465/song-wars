import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomMode } from "../../types/game";
import type {
  OnlineRoomMemberPresence,
  OnlineRoomSettingsUpdate,
  OnlineRoomSnapshot,
} from "../../types/onlineRoom";
import type { Json } from "../../types/supabase";
import type { MediaTrack } from "../../types/media";
import { getSupabaseClient } from "../supabase/client";
import { mapOnlineRoomSnapshot } from "./onlineRoomSnapshotMapper";

export interface CreateOnlineRoomOptions {
  displayName: string;
  mode: RoomMode;
  songsPerPlayer: number;
  pointsToWin: number;
}

export interface JoinOnlineRoomOptions {
  code: string;
  displayName: string;
}

export interface OnlineRoomSubscription {
  unsubscribe: () => Promise<void>;
}

export async function createOnlineRoom(
  options: CreateOnlineRoomOptions,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("create_room", {
    host_display_name: options.displayName,
    points_to_win_value: options.pointsToWin,
    room_mode: options.mode,
    songs_per_player_value: options.songsPerPlayer,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function joinOnlineRoom(
  options: JoinOnlineRoomOptions,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("join_room", {
    guest_display_name: options.displayName,
    room_code: options.code,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function fetchOnlineRoomSnapshot(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("get_room_snapshot", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function leaveOnlineRoom(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("leave_room", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function removeOnlineRoomMember(
  roomId: string,
  memberId: string,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("remove_room_member", {
    member_id_value: memberId,
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function updateOnlineRoomSettings(
  roomId: string,
  update: OnlineRoomSettingsUpdate,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("update_room_settings", {
    points_to_win_value: update.pointsToWin ?? null,
    room_id_value: roomId,
    room_mode: update.mode ?? null,
    songs_per_player_value: update.songsPerPlayer ?? null,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function startOnlineRoom(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("start_room", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function submitOnlineRoundTopic(
  roomId: string,
  topic: string,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("submit_round_topic", {
    room_id_value: roomId,
    topic_value: topic,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function submitOnlineRoundSong(
  roomId: string,
  song: MediaTrack,
): Promise<OnlineRoomSnapshot> {
  if (!song.preview?.streamUrl) {
    throw new Error("Choose a song with an in-app playable preview.");
  }

  const result = await getSupabaseClient().rpc("submit_round_song", {
    album_name_value: song.albumName ?? null,
    artists_value: song.artists,
    artwork_url_value: song.artwork?.url ?? null,
    preview_url_value: song.preview?.streamUrl ?? null,
    provider_refs_value: song.providerRefs as unknown as Json,
    room_id_value: roomId,
    title_value: song.title,
    track_id_value: song.id,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function removeOwnOnlineSubmission(
  roomId: string,
  submissionId: string,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("remove_own_submission", {
    room_id_value: roomId,
    submission_id_value: submissionId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function selectOnlineMatchupWinner(
  roomId: string,
  matchupId: string,
  winnerSubmissionId: string,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("select_matchup_winner", {
    matchup_id_value: matchupId,
    room_id_value: roomId,
    winner_submission_id_value: winnerSubmissionId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function scheduleOnlineMatchupPreview(
  roomId: string,
  matchupId: string,
  submissionId: string,
): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("schedule_matchup_preview", {
    matchup_id_value: matchupId,
    room_id_value: roomId,
    submission_id_value: submissionId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function fetchOnlineServerNowMs(): Promise<number> {
  const result = await getSupabaseClient().rpc("get_server_time", {});

  if (result.error) {
    throw result.error;
  }

  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
    throw new Error("Server time check did not return a valid result.");
  }

  return numberValue(result.data.server_now_ms);
}

export async function prepareNextOnlineRound(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("prepare_next_round", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function playAgainOnlineRoom(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("play_again", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export async function closeOnlineRoom(roomId: string): Promise<OnlineRoomSnapshot> {
  const result = await getSupabaseClient().rpc("close_room", {
    room_id_value: roomId,
  });

  return unwrapSnapshotResult(result.data, result.error);
}

export function subscribeToOnlineRoom(
  roomId: string,
  memberId: string | undefined,
  onSnapshotNeeded: () => void,
  onPresenceChange: (presence: OnlineRoomMemberPresence[]) => void,
): OnlineRoomSubscription {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(`online-room:${roomId}`, {
    config: {
      presence: {
        key: memberId ?? "unknown",
      },
      private: true,
    },
  });

  channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "round_submissions",
        filter: `room_id=eq.${roomId}`,
      },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_playback_events",
        filter: `room_id=eq.${roomId}`,
      },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "round_matchups",
        filter: `room_id=eq.${roomId}`,
      },
      onSnapshotNeeded,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_scores",
        filter: `room_id=eq.${roomId}`,
      },
      onSnapshotNeeded,
    )
    .on("presence", { event: "sync" }, () => {
      onPresenceChange(readPresence(channel));
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED" && memberId) {
        await channel.track({ member_id: memberId, online_at: new Date().toISOString() });
      }
    });

  return {
    unsubscribe: async () => {
      await channel.untrack();
      await supabase.removeChannel(channel);
    },
  };
}

function unwrapSnapshotResult(data: Json, error: Error | null): OnlineRoomSnapshot {
  if (error) {
    throw error;
  }

  return mapOnlineRoomSnapshot(data);
}

function readPresence(channel: RealtimeChannel): OnlineRoomMemberPresence[] {
  return Object.keys(channel.presenceState()).map((memberId) => ({
    memberId,
    status: "online",
  }));
}

function numberValue(value: Json | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}
