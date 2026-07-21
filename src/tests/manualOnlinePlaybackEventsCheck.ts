import assert from "node:assert/strict";
import {
  getLatestOnlinePlaybackEvent,
  isOnlinePlaybackEventActive,
} from "../services/online/onlinePlaybackEvents.ts";
import type { OnlinePlaybackEvent } from "../types/onlineRoom.ts";

const olderEvent = makePlaybackEvent({
  createdAt: "2026-07-21T10:00:00.000Z",
  id: "older",
  serverStartAt: "2026-07-21T10:00:02.000Z",
});
const newerEvent = makePlaybackEvent({
  createdAt: "2026-07-21T10:01:00.000Z",
  id: "newer",
  serverStartAt: "2026-07-21T10:01:02.000Z",
});

assert.equal(
  getLatestOnlinePlaybackEvent([olderEvent, newerEvent])?.id,
  "newer",
  "latest playback event should sort by creation time",
);
assert.equal(
  isOnlinePlaybackEventActive(newerEvent, Date.parse("2026-07-21T10:01:20.000Z")),
  true,
  "playback event should stay active until its duration ends",
);
assert.equal(
  isOnlinePlaybackEventActive(newerEvent, Date.parse("2026-07-21T10:02:00.000Z")),
  false,
  "playback event should expire after its duration",
);

console.log("Online playback event checks passed.");

function makePlaybackEvent(
  overrides: Pick<OnlinePlaybackEvent, "createdAt" | "id" | "serverStartAt">,
): OnlinePlaybackEvent {
  return {
    createdAt: overrides.createdAt,
    createdByMemberId: "judge-member",
    durationMs: 30000,
    id: overrides.id,
    matchupId: "matchup-id",
    previewUrl: "https://example.com/preview.m4a",
    roomId: "room-id",
    roundId: "round-id",
    serverStartAt: overrides.serverStartAt,
    submissionId: "submission-id",
    title: "Song",
    trackId: "track-id",
  };
}
