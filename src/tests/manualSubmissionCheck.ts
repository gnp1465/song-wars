import assert from "node:assert/strict";
import {
  createSongSubmission,
  getSubmissionSongLabel,
  getSongKey,
  hasDuplicateSongSubmission,
} from "../services/game/submissions.ts";
import type { MediaTrack } from "../types/media.ts";

const playableTrack: MediaTrack = {
  id: "apple:123",
  title: "Golden",
  artists: ["Harry Styles"],
  artwork: {
    url: "https://example.com/golden.jpg",
    width: 300,
    height: 300,
  },
  providerRefs: [{ providerId: "apple_itunes", providerTrackId: "123" }],
  capabilities: ["stream_preview"],
  resolutionStatus: "resolved",
  preview: {
    providerId: "apple_itunes",
    streamUrl: "https://example.com/golden-preview.m4a",
    durationMs: 30000,
  },
  attribution: [{ providerId: "apple_itunes", providerName: "Apple iTunes" }],
};

const submission = createSongSubmission({
  id: "round-1:sub-1",
  playerId: "player-2",
  roundId: "round-1",
  song: playableTrack,
  submittedAtMs: 1000,
});

assert.equal(submission.song, playableTrack, "Submission should keep the selected track object.");
assert.equal(
  submission.song.preview?.streamUrl,
  playableTrack.preview?.streamUrl,
  "Submission should preserve preview stream data for judging playback.",
);
assert.equal(
  submission.song.artwork?.url,
  playableTrack.artwork?.url,
  "Submission should preserve artwork data for future UI.",
);
assert.equal(submission.submittedAtMs, 1000);

assert.equal(
  hasDuplicateSongSubmission([submission], {
    ...playableTrack,
    id: "different-provider-id",
    title: " golden ",
  }),
  true,
  "Duplicate checks should ignore title casing and outside spaces.",
);
assert.equal(getSongKey(playableTrack), "golden:harry styles");

const earlierSubmissionFromSamePlayer = createSongSubmission({
  id: "round-1:sub-0",
  playerId: "player-2",
  roundId: "round-1",
  song: {
    ...playableTrack,
    id: "apple:456",
    title: "As It Was",
  },
  submittedAtMs: 900,
});

assert.equal(
  getSubmissionSongLabel([earlierSubmissionFromSamePlayer, submission], submission.id),
  "Golden by Harry Styles",
  "Winning song labels should use the exact winning submission id.",
);
assert.equal(getSubmissionSongLabel([submission], undefined), "Pending");
assert.equal(getSubmissionSongLabel([submission], "missing-submission"), "Pending");

console.log("Submission checks passed.");
