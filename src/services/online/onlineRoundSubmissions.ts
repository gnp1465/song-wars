import type {
  OnlineRoomMember,
  OnlineRound,
  OnlineRoundSubmission,
} from "../../types/onlineRoom";
import type { MediaTrack } from "../../types/media";
import { getSongKey } from "../game/submissions.ts";

export interface OnlineSubmissionState {
  currentMember?: OnlineRoomMember;
  currentRound?: OnlineRound;
  isMutating: boolean;
  songsPerPlayer: number;
  submissions: OnlineRoundSubmission[];
}

export function getOnlineSubmissionCountForMember(
  submissions: OnlineRoundSubmission[],
  memberId: string | undefined,
): number {
  if (!memberId) {
    return 0;
  }

  return submissions.filter((submission) => submission.memberId === memberId).length;
}

export function getOnlineSongsRemaining({
  currentMember,
  songsPerPlayer,
  submissions,
}: Pick<OnlineSubmissionState, "currentMember" | "songsPerPlayer" | "submissions">): number {
  return Math.max(
    0,
    songsPerPlayer - getOnlineSubmissionCountForMember(submissions, currentMember?.id),
  );
}

export function canSubmitOnlineSong({
  currentMember,
  currentRound,
  isMutating,
  songsPerPlayer,
  submissions,
}: OnlineSubmissionState): boolean {
  return Boolean(
    currentMember &&
      currentRound &&
      currentRound.status === "submitting" &&
      currentMember.id !== currentRound.judgeMemberId &&
      getOnlineSongsRemaining({ currentMember, songsPerPlayer, submissions }) > 0 &&
      !isMutating,
  );
}

export function hasDuplicateOnlineSongSubmission(
  submissions: Array<Pick<OnlineRoundSubmission, "song">>,
  song: MediaTrack,
): boolean {
  const songKey = getSongKey(song);

  return submissions.some((submission) => getSongKey(submission.song) === songKey);
}
