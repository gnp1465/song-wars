import assert from "node:assert/strict";
import { mapOnlineRoomSnapshot } from "../services/online/onlineRoomSnapshotMapper.ts";

const snapshot = mapOnlineRoomSnapshot({
  current_round: {
    created_at: "2026-07-19T00:00:00.000Z",
    id: "round-1",
    judge_member_id: "member-host",
    room_id: "room-1",
    round_number: 1,
    status: "judging",
    topic: "Beach vibes",
    winning_member_id: null,
    winning_submission_id: null,
  },
  matchups: [
    {
      bracket_round_number: 1,
      has_bye: false,
      id: "matchup-1",
      left_submission_id: "submission-1",
      position: 1,
      right_submission_id: "submission-2",
      room_id: "room-1",
      round_id: "round-1",
      status: "ready",
      winner_submission_id: null,
    },
  ],
  members: [
    {
      display_name: "Host",
      id: "member-host",
      join_order: 1,
      joined_at: "2026-07-19T00:00:00.000Z",
      role: "host",
      room_id: "room-1",
      user_id: "user-host",
    },
    {
      display_name: "Maya",
      id: "member-maya",
      join_order: 2,
      joined_at: "2026-07-19T00:00:01.000Z",
      role: "guest",
      room_id: "room-1",
      user_id: "user-maya",
    },
  ],
  playback_events: [
    {
      created_at: "2026-07-19T00:00:10.000Z",
      created_by_member_id: "member-host",
      duration_ms: 30000,
      id: "playback-1",
      matchup_id: "matchup-1",
      preview_url: "https://example.com/preview-1.m4a",
      room_id: "room-1",
      round_id: "round-1",
      server_start_at: "2026-07-19T00:00:12.000Z",
      submission_id: "submission-1",
      title: "Song One",
      track_id: "track-1",
    },
  ],
  presence: [
    {
      member_id: "member-host",
      status: "online",
    },
  ],
  room: {
    code: null,
    created_at: "2026-07-19T00:00:00.000Z",
    expires_at: "2026-07-19T12:00:00.000Z",
    game_winner_member_id: null,
    host_user_id: "user-host",
    id: "room-1",
    mode: "remote",
    points_to_win: 3,
    songs_per_player: 1,
    status: "in_round",
  },
  scores: [
    {
      member_id: "member-maya",
      points: 1,
      room_id: "room-1",
      updated_at: "2026-07-19T00:00:11.000Z",
    },
  ],
  submissions: [
    {
      album_name: "Album One",
      artists: ["Artist One"],
      artwork_url: "https://example.com/artwork-1.jpg",
      id: "submission-1",
      member_id: "member-maya",
      preview_url: "https://example.com/preview-1.m4a",
      provider_refs: [
        {
          providerId: "apple_itunes",
          providerTrackId: "apple-1",
          url: "https://example.com/song-1",
        },
      ],
      room_id: "room-1",
      round_id: "round-1",
      submitted_at: "2026-07-19T00:00:05.000Z",
      title: "Song One",
      track_id: "track-1",
    },
    {
      album_name: "Album Two",
      artists: ["Artist Two"],
      artwork_url: null,
      id: "submission-2",
      member_id: "member-host",
      preview_url: "https://example.com/preview-2.m4a",
      provider_refs: [],
      room_id: "room-1",
      round_id: "round-1",
      submitted_at: "2026-07-19T00:00:06.000Z",
      title: "Song Two",
      track_id: "track-2",
    },
  ],
});

assert.equal(snapshot.room.id, "room-1");
assert.equal(snapshot.room.mode, "remote");
assert.equal(snapshot.room.code, undefined);
assert.equal(snapshot.currentRound?.status, "judging");
assert.equal(snapshot.currentRound?.topic, "Beach vibes");
assert.equal(snapshot.members[0].role, "host");
assert.equal(snapshot.presence[0].status, "online");
assert.equal(snapshot.submissions[0].song.preview?.streamUrl, "https://example.com/preview-1.m4a");
assert.equal(snapshot.submissions[0].song.providerRefs[0].providerId, "apple_itunes");
assert.equal(snapshot.matchups[0].left?.song.title, "Song One");
assert.equal(snapshot.matchups[0].right?.song.title, "Song Two");
assert.equal(snapshot.scores[0].points, 1);
assert.equal(snapshot.playbackEvents[0].trackId, "track-1");

assert.throws(() => mapOnlineRoomSnapshot(null), /room snapshot/);
assert.throws(() => mapOnlineRoomSnapshot([]), /room snapshot/);

console.log("Online snapshot mapping checks passed.");
