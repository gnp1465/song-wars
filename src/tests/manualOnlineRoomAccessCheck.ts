import { getOnlineRoomExitNotice } from "../services/online/onlineRoomAccess.ts";
import type { OnlineRoomSnapshot } from "../types/onlineRoom.ts";

const lobbySnapshot = makeSnapshot("lobby");
const closedSnapshot = makeSnapshot("closed");
const expiredSnapshot = makeSnapshot("expired");
const memberSnapshot = makeSnapshot("lobby", "current-user");

assert(
  getOnlineRoomExitNotice(lobbySnapshot) === undefined,
  "active lobby rooms should not exit",
);
assert(
  getOnlineRoomExitNotice(closedSnapshot) === "Room closed by the host.",
  "closed rooms should return home with a clear notice",
);
assert(
  getOnlineRoomExitNotice(expiredSnapshot) === "Room expired.",
  "expired rooms should return home with a clear notice",
);
assert(
  getOnlineRoomExitNotice(lobbySnapshot, "You are not a member of this room.") ===
    "You are no longer in that room.",
  "removed users should return home with a clear notice",
);
assert(
  getOnlineRoomExitNotice(memberSnapshot, undefined, "current-user") === undefined,
  "current members should remain in the room",
);
assert(
  getOnlineRoomExitNotice(memberSnapshot, undefined, "removed-user") ===
    "You are no longer in that room.",
  "users missing from the member list should return home with a clear notice",
);

console.log("Online room access checks passed.");

function makeSnapshot(
  status: OnlineRoomSnapshot["room"]["status"],
  currentUserId?: string,
): OnlineRoomSnapshot {
  return {
    matchups: [],
    members: currentUserId
      ? [
          {
            displayName: "Current User",
            id: "member-id",
            joinedAt: "2026-07-18T00:00:00.000Z",
            joinOrder: 1,
            role: "guest",
            roomId: "room-id",
            userId: currentUserId,
          },
        ]
      : [],
    presence: [],
    playbackEvents: [],
    room: {
      createdAt: "2026-07-18T00:00:00.000Z",
      expiresAt: "2026-07-18T12:00:00.000Z",
      hostUserId: "host-user",
      id: "room-id",
      mode: "single_speaker",
      pointsToWin: 3,
      songsPerPlayer: 1,
      status,
    },
    scores: [],
    submissions: [],
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
