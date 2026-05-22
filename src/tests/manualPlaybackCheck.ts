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
