import assert from "node:assert/strict";
import {
  createPlaybackSchedule,
  estimateClockOffsetMs,
} from "../services/audio/playbackScheduler.ts";
import {
  initialPlaybackState,
  isPlaybackUiLocked,
  reducePlaybackState,
} from "../state/playbackStateMachine.ts";
import {
  createClockSyncEstimate,
  createRemotePlaybackPlan,
  getRemotePlaybackProgress,
} from "../services/audio/remotePlaybackSync.ts";
import {
  getPreviewCacheFileName,
  getPreviewCacheUri,
} from "../services/audio/previewCacheKey.ts";
import { getMatchupPreviewCacheTargets } from "../services/audio/previewPreloadQueue.ts";
import type { MatchupEntry } from "../types/game.ts";
import type { MediaTrack } from "../types/media.ts";

const offsetMs = estimateClockOffsetMs({
  serverNowMs: 1100,
  clientSentAtMs: 900,
  clientReceivedAtMs: 1000,
});

assert.equal(offsetMs, 150);

const schedule = createPlaybackSchedule({
  serverStartAtMs: 2100,
  serverNowMs: 1100,
  localNowMs: 1000,
  clockOffsetMs: 100,
});

assert.equal(schedule.localStartAtMs, 2000);
assert.equal(schedule.delayMs, 1000);
assert.equal(schedule.isLate, false);

const clockEstimate = createClockSyncEstimate([
  {
    clientReceivedAtMs: 1200,
    clientSentAtMs: 1000,
    serverNowMs: 1075,
  },
  {
    clientReceivedAtMs: 1110,
    clientSentAtMs: 1000,
    serverNowMs: 1030,
  },
]);

assert.equal(clockEstimate.roundTripMs, 110);
assert.equal(clockEstimate.clockOffsetMs, -25);
assert.equal(clockEstimate.sampleCount, 2);

const remotePlan = createRemotePlaybackPlan({
  clockOffsetMs: -25,
  durationMs: 30000,
  localNowMs: 1000,
  preloadLeadMs: 3000,
  serverStartAtMs: 5025,
});

assert.equal(remotePlan.localStartAtMs, 5050);
assert.equal(remotePlan.delayMs, 4050);
assert.equal(remotePlan.localPreloadAtMs, 2050);
assert.equal(remotePlan.uiUnlockAtMs, 35050);
assert.equal(remotePlan.progressMsAtLocalNow, 0);
assert.equal(remotePlan.isLate, false);
assert.equal(remotePlan.hasEnded, false);

const expiredRemotePlan = createRemotePlaybackPlan({
  clockOffsetMs: 0,
  durationMs: 30000,
  localNowMs: 41000,
  serverStartAtMs: 10000,
});

assert.equal(expiredRemotePlan.delayMs, 0);
assert.equal(expiredRemotePlan.isLate, true);
assert.equal(expiredRemotePlan.hasEnded, true);
assert.equal(expiredRemotePlan.progressMsAtLocalNow, 30000);
assert.equal(getRemotePlaybackProgress(-500, 30000), 0);
assert.equal(getRemotePlaybackProgress(15000, 30000), 0.5);
assert.equal(getRemotePlaybackProgress(45000, 30000), 1);
assert.equal(getRemotePlaybackProgress(1000, 0), 0);

assert.equal(
  getPreviewCacheFileName({
    previewUrl: "https://example.com/song-preview.m4a",
    trackId: "song 1/id",
  }).startsWith("song-1-id-"),
  true,
);
assert.equal(
  getPreviewCacheUri(
    {
      previewUrl: "https://example.com/song-preview.m4a",
      trackId: "track-1",
    },
    "file:///cache/",
  )?.startsWith("file:///cache/song-wars-previews/track-1-"),
  true,
);

const preloadableSong = makePreviewSong("track-1", "https://example.com/preview-1.m4a");
const duplicatePreloadableSong = makePreviewSong("track-1", "https://example.com/preview-1.m4a");
const metadataOnlySong = makePreviewSong("track-2");
const cacheTargets = getMatchupPreviewCacheTargets([
  makeMatchupEntry("submission-1", preloadableSong),
  makeMatchupEntry("submission-2", duplicatePreloadableSong),
  makeMatchupEntry("submission-3", metadataOnlySong),
  undefined,
]);

assert.deepEqual(cacheTargets, [
  {
    previewUrl: "https://example.com/preview-1.m4a",
    trackId: "track-1",
  },
]);

let state = initialPlaybackState;

state = reducePlaybackState(state, { type: "start" });
assert.equal(state.name, "idle");

state = reducePlaybackState(state, {
  type: "prepare",
  matchId: "match-1",
  trackId: "song-a",
});
assert.equal(state.name, "preparing_stream");
assert.equal(isPlaybackUiLocked(state), false);

state = reducePlaybackState(state, {
  type: "schedule",
  serverStartAtMs: 2100,
  durationMs: 30000,
});
assert.equal(state.name, "scheduled");
assert.equal(isPlaybackUiLocked(state), true);

state = reducePlaybackState(state, { type: "start" });
assert.equal(state.name, "playing_locked");
assert.equal(isPlaybackUiLocked(state), true);

state = reducePlaybackState(state, { type: "finish" });
assert.equal(state.name, "finished");
assert.equal(isPlaybackUiLocked(state), false);

console.log("Playback scheduling and state checks passed.");

function makeMatchupEntry(submissionId: string, song: MediaTrack): MatchupEntry {
  return {
    playerId: `${submissionId}-player`,
    song,
    submissionId,
  };
}

function makePreviewSong(id: string, previewUrl?: string): MediaTrack {
  return {
    artists: ["Artist"],
    attribution: [],
    capabilities: previewUrl ? ["stream_preview"] : ["metadata_only"],
    id,
    preview: previewUrl
      ? {
          providerId: "apple_itunes",
          streamUrl: previewUrl,
        }
      : undefined,
    providerRefs: [],
    resolutionStatus: previewUrl ? "resolved" : "preview_unavailable",
    title: id,
  };
}
