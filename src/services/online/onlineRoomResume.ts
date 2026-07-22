import type { OnlineRoomSnapshot } from "../../types/onlineRoom";

export type OnlineRoomResumeRoute = "lobby" | "round";

export function getOnlineRoomResumeFailureMessage(): string {
  return "Could not verify your last online room. Check your connection and retry.";
}

export interface OnlineRoomResumeFailureDecision {
  message: string;
  shouldClearSavedRoom: boolean;
}

export function getOnlineRoomResumeFailureDecision(
  errorMessage?: string,
): OnlineRoomResumeFailureDecision {
  const normalizedErrorMessage = errorMessage?.toLowerCase() ?? "";

  if (normalizedErrorMessage.includes("not a member")) {
    return {
      message: "You are no longer in that room.",
      shouldClearSavedRoom: true,
    };
  }

  if (
    normalizedErrorMessage.includes("room closed") ||
    normalizedErrorMessage.includes("room expired")
  ) {
    return {
      message: "That room is no longer active.",
      shouldClearSavedRoom: true,
    };
  }

  return {
    message: getOnlineRoomResumeFailureMessage(),
    shouldClearSavedRoom: false,
  };
}

export function getOnlineRoomResumeRoute(
  snapshot: OnlineRoomSnapshot,
  currentUserId: string,
): OnlineRoomResumeRoute | undefined {
  const isMember = snapshot.members.some((member) => member.userId === currentUserId);

  if (!isMember || snapshot.room.status === "closed" || snapshot.room.status === "expired") {
    return undefined;
  }

  if (snapshot.room.status === "lobby") {
    return "lobby";
  }

  return "round";
}
