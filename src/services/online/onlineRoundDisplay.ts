import type { OnlineRoundStatus } from "../../types/onlineRoom";

export function getOnlineRoundTitle(status: OnlineRoundStatus | undefined): string {
  if (status === "submitting") {
    return "Submissions";
  }

  if (status === "judging") {
    return "Judging next";
  }

  if (status === "complete") {
    return "Round complete";
  }

  return "Topic setup";
}

export function getOnlineRoundSubtitle(status: OnlineRoundStatus | undefined): string {
  if (status === "submitting") {
    return "Contestants pick songs for the locked topic.";
  }

  if (status === "judging") {
    return "The submission phase is complete.";
  }

  if (status === "complete") {
    return "Scores are updated and the next judge is set.";
  }

  return "The judge sets the prompt for this round.";
}
