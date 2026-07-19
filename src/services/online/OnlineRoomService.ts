import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RoomMode } from "../../types/game";
import type {
  OnlineRoom,
  OnlineRoomMember,
  OnlineRoomMemberPresence,
  OnlineRoomSettingsUpdate,
  OnlineRoomSnapshot,
  OnlineRound,
} from "../../types/onlineRoom";
import type { Json } from "../../types/supabase";
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
  return {
    currentRound: data.current_round ? mapRound(asRecord(data.current_round)) : undefined,
    members: asArray(data.members).map((member) => mapMember(asRecord(member))),
    presence: asArray(data.presence).map((presence) => mapPresence(asRecord(presence))),
    room: mapRoom(asRecord(data.room)),
  };
}

function mapRoom(data: Record<string, Json | undefined>): OnlineRoom {
  return {
    code: typeof data.code === "string" ? data.code : undefined,
    createdAt: stringValue(data.created_at),
    expiresAt: stringValue(data.expires_at),
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

function numberValue(value: Json | undefined): number {
  return typeof value === "number" ? value : 0;
}

function onlineRoomStatusValue(value: Json | undefined): OnlineRoom["status"] {
  if (value === "in_round" || value === "closed" || value === "expired") {
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
