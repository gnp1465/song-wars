import assert from "node:assert/strict";
import {
  generateBracket,
  generateNextRoundMatchups,
  selectMatchupWinner,
} from "../services/game/bracket.ts";
import {
  addGuestToRoom,
  canStartRoom,
  createLocalRoom,
  startRoom,
  updatePointsToWin,
  updateSongsPerPlayer,
} from "../services/game/room.ts";
import { completeRound, getGameWinner, type PlayerScore } from "../services/game/scoring.ts";
import { createDemoTrack } from "../data/demoGame.ts";
import type { BracketMatchup, MatchupEntry, Player, SongSubmission } from "../types/game.ts";

const baseRoom = createLocalRoom({
  hostName: "Gus",
  roomCode: "7392",
  roomId: "room-prototype-test",
  createdAtMs: 1000,
});
const roomWithGuests = addGuestToRoom(
  addGuestToRoom(addGuestToRoom(baseRoom, { displayName: "Maya" }), {
    displayName: "Jay",
  }),
  { displayName: "Nina" },
);
const configuredRoom = updatePointsToWin(updateSongsPerPlayer(roomWithGuests, 2), 2);
const startedRoom = startRoom(configuredRoom);

assert.equal(canStartRoom(configuredRoom), true);
assert.equal(startedRoom.status, "in_round");
assert.equal(startedRoom.settings.songsPerPlayer, 2);
assert.equal(startedRoom.settings.pointsToWin, 2);

let judgePlayerId: string = startedRoom.hostPlayerId;
let scores: PlayerScore[] = [];
let winnerFound = false;
const plannedRoundWinners = ["player-guest-1", "player-guest-2", "player-guest-1"];

for (let roundIndex = 0; roundIndex < plannedRoundWinners.length; roundIndex += 1) {
  const plannedWinnerPlayerId = plannedRoundWinners[roundIndex];
  const roundId = `prototype-round-${roundIndex + 1}`;
  const submittingPlayers = startedRoom.players.filter((player) => player.id !== judgePlayerId);

  assert(
    submittingPlayers.every((player) => player.id !== judgePlayerId),
    "The judge should never be included in the submitting players.",
  );
  assert.notEqual(
    plannedWinnerPlayerId,
    judgePlayerId,
    "The planned round winner must be able to submit in this round.",
  );

  const submissions = createRoundSubmissions({
    players: submittingPlayers,
    roundId,
    songsPerPlayer: startedRoom.settings.songsPerPlayer,
  });
  const expectedSubmissionCount: number =
    submittingPlayers.length * startedRoom.settings.songsPerPlayer;

  assert.equal(
    submissions.length,
    expectedSubmissionCount,
    "Every non-judge player should submit the configured number of songs.",
  );
  assert.equal(
    new Set(submissions.map((submission) => submission.song.title)).size,
    submissions.length,
    "Prototype submissions should be unique within a round.",
  );

  const finalMatchup = completeBracket({
    matchups: generateBracket({ roundId, submissions, seed: 50 + roundIndex }),
    preferredWinnerPlayerId: plannedWinnerPlayerId,
    roundId,
  });
  const roundResult = completeRound({
    players: startedRoom.players,
    finalMatchup,
    currentScores: scores,
  });

  scores = roundResult.scores;
  judgePlayerId = roundResult.nextJudgePlayerId;

  assert.equal(roundResult.winningPlayerId, plannedWinnerPlayerId);
  assert.equal(judgePlayerId, plannedWinnerPlayerId);

  const gameWinner = getGameWinner(scores, startedRoom.settings.pointsToWin);

  if (gameWinner) {
    assert.equal(gameWinner.playerId, "player-guest-1");
    assert.equal(gameWinner.points, 2);
    winnerFound = true;
    break;
  }
}

assert.equal(winnerFound, true, "The prototype flow should produce a final winner.");

console.log("End-to-end prototype flow checks passed.");

interface CreateRoundSubmissionsOptions {
  players: Player[];
  roundId: string;
  songsPerPlayer: number;
}

function createRoundSubmissions({
  players,
  roundId,
  songsPerPlayer,
}: CreateRoundSubmissionsOptions): SongSubmission[] {
  return players.flatMap((player) =>
    Array.from({ length: songsPerPlayer }, (_, songIndex) => ({
      id: `${roundId}:${player.id}:song-${songIndex + 1}`,
      playerId: player.id,
      roundId,
      song: createDemoTrack(
        `${player.displayName} Song ${songIndex + 1} ${roundId}`,
        player.displayName,
      ),
      submittedAtMs: 1000 + songIndex,
    })),
  );
}

interface CompleteBracketOptions {
  matchups: BracketMatchup[];
  preferredWinnerPlayerId: string;
  roundId: string;
}

function completeBracket({
  matchups,
  preferredWinnerPlayerId,
  roundId,
}: CompleteBracketOptions): BracketMatchup {
  let allMatchups = matchups;
  let activeRoundNumber = 1;

  while (true) {
    const currentRoundMatchups = allMatchups.filter(
      (matchup) => matchup.roundNumber === activeRoundNumber,
    );
    const readyMatchup = currentRoundMatchups.find((matchup) => matchup.status === "ready");

    if (readyMatchup) {
      const winnerEntry = chooseWinnerEntry(readyMatchup, preferredWinnerPlayerId);
      const completedMatchup = selectMatchupWinner(readyMatchup, winnerEntry.submissionId);

      allMatchups = allMatchups.map((matchup) =>
        matchup.id === completedMatchup.id ? completedMatchup : matchup,
      );
      continue;
    }

    assert(
      currentRoundMatchups.every((matchup) => matchup.status === "complete"),
      "A bracket round should be complete before creating the next round.",
    );

    const nextRoundMatchups = generateNextRoundMatchups(roundId, currentRoundMatchups);

    if (nextRoundMatchups.length === 0) {
      assert.equal(currentRoundMatchups.length, 1);
      return currentRoundMatchups[0];
    }

    allMatchups = [...allMatchups, ...nextRoundMatchups];
    activeRoundNumber = nextRoundMatchups[0].roundNumber;
  }
}

function chooseWinnerEntry(
  matchup: BracketMatchup,
  preferredWinnerPlayerId: string,
): MatchupEntry {
  const entries = [matchup.left, matchup.right].filter(
    (entry): entry is MatchupEntry => Boolean(entry),
  );
  const preferredEntry = entries.find((entry) => entry.playerId === preferredWinnerPlayerId);

  return preferredEntry ?? entries[0];
}
