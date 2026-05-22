import assert from "node:assert/strict";
import { selectMatchupWinner } from "../services/game/bracket.ts";
import { completeRound, incrementPlayerScore } from "../services/game/scoring.ts";
import type { BracketMatchup, Player } from "../types/game.ts";
import type { MediaTrack } from "../types/media.ts";

const players: Player[] = [
  { id: "player-1", displayName: "Gus", isHost: true, isGuest: false },
  { id: "player-2", displayName: "Maya", isHost: false, isGuest: true },
];

const finalMatchup: BracketMatchup = {
  id: "round-1:r2:m1",
  roundNumber: 2,
  position: 1,
  status: "ready",
  left: {
    submissionId: "sub-1",
    playerId: "player-1",
    song: createTrack("Espresso"),
  },
  right: {
    submissionId: "sub-2",
    playerId: "player-2",
    song: createTrack("Golden"),
  },
  hasBye: false,
};

const completedFinal = selectMatchupWinner(finalMatchup, "sub-2");
const result = completeRound({
  players,
  finalMatchup: completedFinal,
  currentScores: [{ playerId: "player-1", points: 1 }],
});

assert.equal(result.winningSubmissionId, "sub-2");
assert.equal(result.winningPlayerId, "player-2");
assert.equal(result.nextJudgePlayerId, "player-2");
assert.deepEqual(result.scores, [
  { playerId: "player-1", points: 1 },
  { playerId: "player-2", points: 1 },
]);

assert.deepEqual(incrementPlayerScore(result.scores, "player-2"), [
  { playerId: "player-1", points: 1 },
  { playerId: "player-2", points: 2 },
]);

assert.throws(() =>
  completeRound({
    players,
    finalMatchup,
    currentScores: [],
  }),
);

console.log("Scoring checks passed.");

function createTrack(title: string): MediaTrack {
  return {
    id: `mock:${title}`,
    title,
    artists: ["Mock Artist"],
    providerRefs: [],
    capabilities: ["metadata_only"],
    resolutionStatus: "unresolved",
    attribution: [],
  };
}
