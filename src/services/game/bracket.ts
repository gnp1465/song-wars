import type { BracketMatchup, MatchupEntry, SongSubmission } from "../../types/game";

export interface GenerateBracketOptions {
  roundId: string;
  submissions: SongSubmission[];
  seed?: number;
}

export function generateBracket(options: GenerateBracketOptions): BracketMatchup[] {
  const shuffledEntries = shuffleEntries(
    options.submissions.map((submission) => toMatchupEntry(submission)),
    options.seed ?? Date.now(),
  );
  const bracketSize = getNextPowerOfTwo(Math.max(1, shuffledEntries.length));
  const firstRoundPairs = createFirstRoundPairs(shuffledEntries, bracketSize);

  return firstRoundPairs.map(([left, right], index) => {
    const hasBye = Boolean(left && !right);

    return {
      id: `${options.roundId}:r1:m${index + 1}`,
      roundNumber: 1,
      position: index + 1,
      status: hasBye ? "complete" : "ready",
      left,
      right,
      winnerSubmissionId: hasBye ? left?.submissionId : undefined,
      hasBye,
    };
  });
}

export function selectMatchupWinner(
  matchup: BracketMatchup,
  winnerSubmissionId: string,
): BracketMatchup {
  const validWinner =
    matchup.left?.submissionId === winnerSubmissionId ||
    matchup.right?.submissionId === winnerSubmissionId;

  if (!validWinner) {
    throw new Error("Winner must be one of the matchup entries.");
  }

  return {
    ...matchup,
    status: "complete",
    winnerSubmissionId,
  };
}

export function generateNextRoundMatchups(
  roundId: string,
  completedMatchups: BracketMatchup[],
): BracketMatchup[] {
  const winnerEntries = completedMatchups.map((matchup) => {
    if (matchup.status !== "complete" || !matchup.winnerSubmissionId) {
      throw new Error("All matchups must be complete before generating the next round.");
    }

    const winner = getWinnerEntry(matchup);

    if (!winner) {
      throw new Error("Completed matchup winner could not be found.");
    }

    return winner;
  });

  if (winnerEntries.length <= 1) {
    return [];
  }

  const nextRoundNumber = Math.max(...completedMatchups.map((matchup) => matchup.roundNumber)) + 1;
  const nextRoundMatchups: BracketMatchup[] = [];

  for (let index = 0; index < winnerEntries.length; index += 2) {
    const left = winnerEntries[index];
    const right = winnerEntries[index + 1];
    const hasBye = Boolean(left && !right);

    nextRoundMatchups.push({
      id: `${roundId}:r${nextRoundNumber}:m${nextRoundMatchups.length + 1}`,
      roundNumber: nextRoundNumber,
      position: nextRoundMatchups.length + 1,
      status: hasBye ? "complete" : "ready",
      left,
      right,
      winnerSubmissionId: hasBye ? left?.submissionId : undefined,
      hasBye,
    });
  }

  return nextRoundMatchups;
}

export function getNextPowerOfTwo(value: number): number {
  let power = 1;

  while (power < value) {
    power *= 2;
  }

  return power;
}

function getWinnerEntry(matchup: BracketMatchup): MatchupEntry | undefined {
  if (matchup.left?.submissionId === matchup.winnerSubmissionId) {
    return matchup.left;
  }

  if (matchup.right?.submissionId === matchup.winnerSubmissionId) {
    return matchup.right;
  }

  return undefined;
}

function toMatchupEntry(submission: SongSubmission): MatchupEntry {
  return {
    submissionId: submission.id,
    playerId: submission.playerId,
    song: submission.song,
  };
}

function createFirstRoundPairs(
  entries: MatchupEntry[],
  bracketSize: number,
): Array<[MatchupEntry, MatchupEntry | undefined]> {
  const byeCount = bracketSize - entries.length;
  const entriesForByes = entries.slice(0, byeCount);
  const entriesForMatchups = entries.slice(byeCount);
  const pairs: Array<[MatchupEntry, MatchupEntry | undefined]> = [];

  for (const entry of entriesForByes) {
    pairs.push([entry, undefined]);
  }

  while (entriesForMatchups.length > 0) {
    const left = entriesForMatchups.shift();

    if (!left) {
      break;
    }

    const opponentIndex = findBestFirstRoundOpponentIndex(left, entriesForMatchups);
    const [right] = entriesForMatchups.splice(opponentIndex, 1);

    pairs.push([left, right]);
  }

  return pairs;
}

function findBestFirstRoundOpponentIndex(
  left: MatchupEntry,
  candidates: MatchupEntry[],
): number {
  const differentPlayerIndex = candidates.findIndex(
    (candidate) => candidate.playerId !== left.playerId,
  );

  return differentPlayerIndex >= 0 ? differentPlayerIndex : 0;
}

function shuffleEntries(entries: MatchupEntry[], seed: number): MatchupEntry[] {
  const shuffled = [...entries];
  let state = seed;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextRandomState(state);
    const swapIndex = state % (index + 1);
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function nextRandomState(state: number): number {
  return (state * 1664525 + 1013904223) >>> 0;
}
