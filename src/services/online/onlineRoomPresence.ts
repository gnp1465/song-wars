import type {
  OnlineRoomMember,
  OnlineRoomMemberPresenceStatus,
  OnlineRoomSnapshot,
} from "../../types/onlineRoom";

export interface OnlinePresenceSummary {
  label: string;
  onlineCount: number;
  totalCount: number;
}

export function getOnlineMemberPresenceStatus(
  snapshot: Pick<OnlineRoomSnapshot, "presence">,
  member: Pick<OnlineRoomMember, "id">,
): OnlineRoomMemberPresenceStatus {
  const presence = snapshot.presence.find((item) => item.memberId === member.id);

  return presence?.status === "online" ? "online" : "offline";
}

export function getOnlinePresenceSummary(
  snapshot: Pick<OnlineRoomSnapshot, "members" | "presence">,
): OnlinePresenceSummary {
  const onlineCount = snapshot.members.filter(
    (member) => getOnlineMemberPresenceStatus(snapshot, member) === "online",
  ).length;
  const totalCount = snapshot.members.length;

  return {
    label: `${onlineCount}/${totalCount} online`,
    onlineCount,
    totalCount,
  };
}
