import type { RealtimeChannel } from "@supabase/supabase-js";
import type { BracketMatchup, MatchupEntry, RoomMode } from "../../types/game";
import type {
  OnlineRoom,
  OnlineRoomMember,
  OnlineRoomMemberPresence,
  OnlinePlaybackEvent,
  OnlineRoomScore,
  OnlineRoomSettingsUpdate,
  OnlineRoomSnapshot,
  OnlineRound,
  OnlineRoundSubmission,
} from "../../types/onlineRoom";
import type { Json } from "../../types/supabase";
import type { MediaTrack, ProviderTrackRef } from "../../types/media";
import { getSupabaseClient } from "../supabase/client";

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

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Online room action did not return a room snapshot.");
  }

  return mapSnapshot(data);
}

function mapSnapshot(data: Record<string, Json | undefined>): OnlineRoomSnapshot {
  const submissions = asArray(data.submissions).map((submission) =>
    mapSubmission(asRecord(submission)),
  );

  return {
    currentRound: data.current_round ? mapRound(asRecord(data.current_round)) : undefined,
    matchups: asArray(data.matchups).map((matchup) =>
      mapMatchup(asRecord(matchup), submissions),
    ),
    members: asArray(data.members).map((member) => mapMember(asRecord(member))),
    presence: asArray(data.presence).map((presence) => mapPresence(asRecord(presence))),
    playbackEvents: asArray(data.playback_events).map((event) =>
      mapPlaybackEvent(asRecord(event)),
    ),
    room: mapRoom(asRecord(data.room)),
    scores: asArray(data.scores).map((score) => mapScore(asRecord(score))),
    submissions,
  };
}

function mapRoom(data: Record<string, Json | undefined>): OnlineRoom {
  return {
    code: typeof data.code === "string" ? data.code : undefined,
    createdAt: stringValue(data.created_at),
    expiresAt: stringValue(data.expires_at),
    gameWinnerMemberId: stringOrUndefined(data.game_winner_member_id),
    hostUserId: stringValue(data.host_user_id),
    id: stringValue(data.id),
    mode: data.mode === "remote" ? "remote" : "single_speaker",
    pointsToWin: numberValue(data.points_to_win),
    songsPerPlayer: numberValue(data.songs_per_player),
    status: onlineRoomStatusValue(data.status),
  };
}

function mapMember(data: Record<string, Json | undefined>): OnlineRoomMember {
  return {
    displayName: stringValue(data.display_name),
    id: stringValue(data.id),
    joinedAt: stringValue(data.joined_at),
    joinOrder: numberValue(data.join_order),
    role: data.role === "host" ? "host" : "guest",
    roomId: stringValue(data.room_id),
    userId: stringValue(data.user_id),
  };
}

function mapPresence(data: Record<string, Json | undefined>): OnlineRoomMemberPresence {
  return {
    memberId: stringValue(data.member_id),
    status: data.status === "online" ? "online" : "offline",
  };
}

function mapRound(data: Record<string, Json | undefined>): OnlineRound {
  return {
    createdAt: stringValue(data.created_at),
    id: stringValue(data.id),
    judgeMemberId: stringValue(data.judge_member_id),
    roomId: stringValue(data.room_id),
    roundNumber: numberValue(data.round_number),
    status: onlineRoundStatusValue(data.status),
    topic: typeof data.topic === "string" ? data.topic : undefined,
    winningMemberId: stringOrUndefined(data.winning_member_id),
    winningSubmissionId: stringOrUndefined(data.winning_submission_id),
  };
}

function mapSubmission(data: Record<string, Json | undefined>): OnlineRoundSubmission {
  const previewUrl = stringOrUndefined(data.preview_url);
  const providerRefs = asProviderRefs(asArray(data.provider_refs));

  return {
    id: stringValue(data.id),
    memberId: stringValue(data.member_id),
    roomId: stringValue(data.room_id),
    roundId: stringValue(data.round_id),
    song: {
      albumName: stringOrUndefined(data.album_name),
      artists: stringArrayValue(data.artists),
      artwork: stringOrUndefined(data.artwork_url)
        ? {
            url: stringValue(data.artwork_url),
          }
        : undefined,
      attribution: [],
      capabilities: previewUrl ? ["stream_preview"] : ["metadata_only"],
      id: stringValue(data.track_id),
      preview: previewUrl
        ? {
            providerId: "apple_itunes",
            streamUrl: previewUrl,
          }
        : undefined,
      providerRefs,
      resolutionStatus: previewUrl ? "resolved" : "preview_unavailable",
      title: stringValue(data.title),
    },
    submittedAt: stringValue(data.submitted_at),
  };
}

function mapMatchup(
  data: Record<string, Json | undefined>,
  submissions: OnlineRoundSubmission[],
): BracketMatchup {
  return {
    hasBye: Boolean(data.has_bye),
    id: stringValue(data.id),
    left: mapMatchupEntry(stringOrUndefined(data.left_submission_id), submissions),
    position: numberValue(data.position),
    right: mapMatchupEntry(stringOrUndefined(data.right_submission_id), submissions),
    roundNumber: numberValue(data.bracket_round_number),
    status: matchupStatusValue(data.status),
    winnerSubmissionId: stringOrUndefined(data.winner_submission_id),
  };
}

function mapMatchupEntry(
  submissionId: string | undefined,
  submissions: OnlineRoundSubmission[],
): MatchupEntry | undefined {
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return undefined;
  }

  return {
    playerId: submission.memberId,
    song: submission.song,
    submissionId: submission.id,
  };
}

function mapScore(data: Record<string, Json | undefined>): OnlineRoomScore {
  return {
    memberId: stringValue(data.member_id),
    points: numberValue(data.points),
    roomId: stringValue(data.room_id),
    updatedAt: stringValue(data.updated_at),
  };
}

function mapPlaybackEvent(data: Record<string, Json | undefined>): OnlinePlaybackEvent {
  return {
    createdAt: stringValue(data.created_at),
    createdByMemberId: stringValue(data.created_by_member_id),
    durationMs: numberValue(data.duration_ms),
    id: stringValue(data.id),
    matchupId: stringValue(data.matchup_id),
    previewUrl: stringValue(data.preview_url),
    roomId: stringValue(data.room_id),
    roundId: stringValue(data.round_id),
    serverStartAt: stringValue(data.server_start_at),
    submissionId: stringValue(data.submission_id),
    title: stringValue(data.title),
    trackId: stringValue(data.track_id),
  };
}

function readPresence(channel: RealtimeChannel): OnlineRoomMemberPresence[] {
  return Object.keys(channel.presenceState()).map((memberId) => ({
    memberId,
    status: "online",
  }));
}

function asArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function stringValue(value: Json | undefined): string {
  return typeof value === "string" ? value : "";
}

function stringOrUndefined(value: Json | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function stringArrayValue(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function numberValue(value: Json | undefined): number {
  return typeof value === "number" ? value : 0;
}

function asProviderRefs(value: Json[]): ProviderTrackRef[] {
  return value
    .map((item) => asRecord(item))
    .map((item) => ({
      providerId: providerTrackRefIdValue(item.providerId),
      providerTrackId: stringValue(item.providerTrackId),
      url: stringOrUndefined(item.url),
    }))
    .filter((item) => item.providerTrackId);
}

function providerTrackRefIdValue(value: Json | undefined): ProviderTrackRef["providerId"] {
  if (
    value === "spotify" ||
    value === "youtube" ||
    value === "soundcloud" ||
    value === "apple_itunes"
  ) {
    return value;
  }

  return "apple_itunes";
}

function onlineRoomStatusValue(value: Json | undefined): OnlineRoom["status"] {
  if (value === "in_round" || value === "complete" || value === "closed" || value === "expired") {
    return value;
  }

  return "lobby";
}

function onlineRoundStatusValue(value: Json | undefined): OnlineRound["status"] {
  if (value === "submitting" || value === "judging" || value === "complete") {
    return value;
  }

  return "waiting_for_topic";
}

function matchupStatusValue(value: Json | undefined): BracketMatchup["status"] {
  if (value === "ready" || value === "complete") {
    return value;
  }

  return "pending";
}
