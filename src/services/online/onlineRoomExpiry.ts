import type { OnlineRoom } from "../../types/onlineRoom";

export function getOnlineRoomExpiryLabel(
  room: Pick<OnlineRoom, "expiresAt">,
  nowMs = Date.now(),
): string {
  const expiresAtMs = Date.parse(room.expiresAt);

  if (!Number.isFinite(expiresAtMs)) {
    return "Temporary room";
  }

  const remainingMs = expiresAtMs - nowMs;

  if (remainingMs <= 0) {
    return "Expired";
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);

  if (remainingMinutes < 60) {
    return `Expires in ${remainingMinutes}m`;
  }

  const remainingHours = Math.floor(remainingMinutes / 60);
  const extraMinutes = remainingMinutes % 60;

  if (extraMinutes === 0) {
    return `Expires in ${remainingHours}h`;
  }

  return `Expires in ${remainingHours}h ${extraMinutes}m`;
}
