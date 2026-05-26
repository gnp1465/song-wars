import type { BracketMatchup, Player } from "../../types/game";

export interface PlayerScore {
  playerId: string;
  points: number;
}

export interface CompletedRoundResult {
  winningSubmissionId: string;
  winningPlayerId: string;
  nextJudgePlayerId: string;
  scores: PlayerScore[];
}

export interface CompleteRoundOptions {
  players: Player[];
  finalMatchup: BracketMatchup;
  currentScores: PlayerScore[];
}

export function completeRound(options: CompleteRoundOptions): CompletedRoundResult {
  if (options.finalMatchup.status !== "complete" || !options.finalMatchup.winnerSubmissionId) {
    throw new Error("Final matchup must be complete before scoring the round.");
  }

  const winningEntry =
    options.finalMatchup.left?.submissionId === options.finalMatchup.winnerSubmissionId
      ? options.finalMatchup.left
      : options.finalMatchup.right?.submissionId === options.finalMatchup.winnerSubmissionId
        ? options.finalMatchup.right
        : undefined;

  if (!winningEntry) {
    throw new Error("Final matchup winner could not be matched to a player.");
  }

  if (!options.players.some((player) => player.id === winningEntry.playerId)) {
    throw new Error("Winning player is not in the room.");
  }

  return {
    winningSubmissionId: winningEntry.submissionId,
    winningPlayerId: winningEntry.playerId,
    nextJudgePlayerId: winningEntry.playerId,
    scores: incrementPlayerScore(options.currentScores, winningEntry.playerId),
  };
}

export function incrementPlayerScore(
  currentScores: PlayerScore[],
  playerId: string,
): PlayerScore[] {
  const existingScore = currentScores.find((score) => score.playerId === playerId);

  if (!existingScore) {
    return [...currentScores, { playerId, points: 1 }];
  }

  return currentScores.map((score) =>
    score.playerId === playerId ? { ...score, points: score.points + 1 } : score,
  );
}

export function getGameWinner(
  scores: PlayerScore[],
  pointsToWin: number,
): PlayerScore | undefined {
  return scores.find((score) => score.points >= pointsToWin);
}
