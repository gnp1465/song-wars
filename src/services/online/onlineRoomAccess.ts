import type { OnlineRoomSnapshot } from "../../types/onlineRoom";

export function getOnlineRoomExitNotice(
  snapshot?: OnlineRoomSnapshot,
  errorMessage?: string,
  currentUserId?: string,
): string | undefined {
  if (snapshot?.room.status === "closed") {
    return "Room closed by the host.";
  }

  if (snapshot?.room.status === "expired") {
    return "Room expired.";
  }

  if (errorMessage?.toLowerCase().includes("not a member")) {
    return "You are no longer in that room.";
  }

  if (snapshot && currentUserId) {
    const isCurrentUserMember = snapshot.members.some((member) => member.userId === currentUserId);

    if (!isCurrentUserMember) {
      return "You are no longer in that room.";
    }
  }

  return undefined;
}
