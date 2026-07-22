import type { BracketMatchup, MatchupEntry } from "../../types/game";
import type { MediaProviderId, ProviderTrackRef } from "../../types/media";
import type {
  OnlinePlaybackEvent,
  OnlineRoom,
  OnlineRoomMember,
  OnlineRoomMemberPresence,
  OnlineRoomScore,
  OnlineRoomSnapshot,
  OnlineRound,
  OnlineRoundSubmission,
} from "../../types/onlineRoom";
import type { Json } from "../../types/supabase";

export function mapOnlineRoomSnapshot(data: Json): OnlineRoomSnapshot {
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
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
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

function providerTrackRefIdValue(value: Json | undefined): MediaProviderId {
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
