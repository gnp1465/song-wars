import type { OnlineRoomSnapshot } from "../../types/onlineRoom";

export type OnlineRoomResumeRoute = "lobby" | "round";

export function getOnlineRoomResumeFailureMessage(): string {
  return "Could not verify your last online room. Check your connection and retry.";
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
