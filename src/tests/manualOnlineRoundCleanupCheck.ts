import assert from "node:assert/strict";
import {
  getOnlineRoundCleanupPlan,
  type OnlineRoundCleanupAction,
} from "../services/online/onlineRoundCleanup.ts";

assert.deepEqual(getOnlineRoundCleanupPlan("submission_submitted"), {
  audioStatus: "Submitted",
  clearPreviewCache: false,
  clearSearchResults: true,
});
assert.deepEqual(getOnlineRoundCleanupPlan("submission_removed"), {
  audioStatus: "Removed submission",
  clearPreviewCache: false,
  clearSearchResults: false,
});
assert.deepEqual(getOnlineRoundCleanupPlan("matchup_winner_picked"), {
  audioStatus: "Winner picked",
  clearPreviewCache: false,
  clearSearchResults: false,
});
assert.deepEqual(getOnlineRoundCleanupPlan("synced_preview_scheduled"), {
  audioStatus: "Scheduling synced preview",
  clearPreviewCache: false,
  clearSearchResults: false,
});

for (const action of ["next_round_started", "game_restarted", "forced_room_exit", "home_navigation"] satisfies OnlineRoundCleanupAction[]) {
  assert.deepEqual(getOnlineRoundCleanupPlan(action), {
    audioStatus: "No preview playing",
    clearPreviewCache: true,
    clearSearchResults: true,
  });
}

for (const action of ["room_closed", "room_left"] satisfies OnlineRoundCleanupAction[]) {
  assert.deepEqual(getOnlineRoundCleanupPlan(action), {
    audioStatus: "No preview playing",
    clearPreviewCache: true,
    clearSearchResults: false,
  });
}

console.log("Online round cleanup checks passed.");
