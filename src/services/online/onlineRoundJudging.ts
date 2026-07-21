import type { BracketMatchup } from "../../types/game";
import type { OnlineRoomMember, OnlineRound } from "../../types/onlineRoom";

export interface OnlineJudgingState {
  currentMember?: OnlineRoomMember;
  currentRound?: OnlineRound;
  isMutating: boolean;
  matchups: BracketMatchup[];
}

export function getActiveOnlineMatchup(matchups: BracketMatchup[]): BracketMatchup | undefined {
  return [...matchups]
    .sort((first, second) =>
      first.roundNumber === second.roundNumber
        ? first.position - second.position
        : first.roundNumber - second.roundNumber,
    )
    .find((matchup) => matchup.status === "ready");
}

export function canJudgeOnlineMatchup({
  currentMember,
  currentRound,
  isMutating,
  matchups,
}: OnlineJudgingState): boolean {
  return Boolean(
    currentMember &&
      currentRound &&
      currentRound.status === "judging" &&
      currentMember.id === currentRound.judgeMemberId &&
      getActiveOnlineMatchup(matchups) &&
      !isMutating,
  );
}
