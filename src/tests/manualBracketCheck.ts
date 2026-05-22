import assert from "node:assert/strict";
import {
  generateBracket,
  generateNextRoundMatchups,
  getNextPowerOfTwo,
  selectMatchupWinner,
} from "../services/game/bracket.ts";
import type { SongSubmission } from "../types/game.ts";
import type { MediaTrack } from "../types/media.ts";

const submissions: SongSubmission[] = [
  createSubmission("sub-1", "player-1", "Espresso"),
  createSubmission("sub-2", "player-2", "Blinding Lights"),
  createSubmission("sub-3", "player-3", "Golden"),
];

assert.equal(getNextPowerOfTwo(1), 1);
assert.equal(getNextPowerOfTwo(3), 4);
assert.equal(getNextPowerOfTwo(8), 8);

const bracket = generateBracket({
  roundId: "round-1",
  submissions,
  seed: 123,
});

assert.equal(bracket.length, 2);
assert.equal(bracket.filter((matchup) => matchup.hasBye).length, 1);
assert.equal(bracket.filter((matchup) => matchup.status === "ready").length, 1);
assert.equal(bracket.filter((matchup) => matchup.status === "complete").length, 1);
assert.equal(new Set(bracket.map((matchup) => matchup.id)).size, bracket.length);

const submissionIdsInBracket = bracket
  .flatMap((matchup) => [matchup.left?.submissionId, matchup.right?.submissionId])
  .filter((submissionId): submissionId is string => submissionId !== undefined);

assert.deepEqual(new Set(submissionIdsInBracket), new Set(["sub-1", "sub-2", "sub-3"]));

const readyMatchup = bracket.find((matchup) => matchup.status === "ready");
assert.ok(readyMatchup?.left?.submissionId);

const completedReadyMatchup = selectMatchupWinner(readyMatchup, readyMatchup.left.submissionId);
const completedRoundOne = bracket.map((matchup) =>
  matchup.id === completedReadyMatchup.id ? completedReadyMatchup : matchup,
);
const finalMatchups = generateNextRoundMatchups("round-1", completedRoundOne);

assert.equal(finalMatchups.length, 1);
assert.equal(finalMatchups[0].roundNumber, 2);
assert.equal(finalMatchups[0].status, "ready");
assert.ok(finalMatchups[0].left?.submissionId);
assert.ok(finalMatchups[0].right?.submissionId);

const completedFinal = selectMatchupWinner(
  finalMatchups[0],
  finalMatchups[0].left.submissionId,
);

assert.equal(completedFinal.status, "complete");
assert.equal(generateNextRoundMatchups("round-1", [completedFinal]).length, 0);
assert.throws(() => selectMatchupWinner(finalMatchups[0], "not-in-matchup"));

const sixSubmissionBracket = generateBracket({
  roundId: "round-2",
  submissions: [
    createSubmission("p1-sub-1", "player-1", "Song 1"),
    createSubmission("p1-sub-2", "player-1", "Song 2"),
    createSubmission("p2-sub-1", "player-2", "Song 3"),
    createSubmission("p2-sub-2", "player-2", "Song 4"),
    createSubmission("p3-sub-1", "player-3", "Song 5"),
    createSubmission("p3-sub-2", "player-3", "Song 6"),
  ],
  seed: 42,
});

assert.equal(sixSubmissionBracket.length, 4);
assert.equal(sixSubmissionBracket.filter((matchup) => matchup.hasBye).length, 2);
assert.equal(
  sixSubmissionBracket.some((matchup) => !matchup.left && !matchup.right),
  false,
);

const firstRoundPlayedMatchups = sixSubmissionBracket.filter(
  (matchup) => matchup.left && matchup.right,
);
assert.equal(firstRoundPlayedMatchups.length, 2);
assert.equal(
  firstRoundPlayedMatchups.every((matchup) => matchup.left?.playerId !== matchup.right?.playerId),
  true,
);

console.log("Bracket generation checks passed.");

function createSubmission(id: string, playerId: string, title: string): SongSubmission {
  return {
    id,
    playerId,
    roundId: "round-1",
    song: createTrack(title),
    submittedAtMs: Date.now(),
  };
}

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
