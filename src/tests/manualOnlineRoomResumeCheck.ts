import assert from "node:assert/strict";
import {
  getOnlineRoomResumeFailureMessage,
  getOnlineRoomResumeRoute,
} from "../services/online/onlineRoomResume.ts";
import type { OnlineRoomSnapshot } from "../types/onlineRoom.ts";

const lobbySnapshot = makeSnapshot("lobby", "current-user");
const roundSnapshot = makeSnapshot("in_round", "current-user");
const completeSnapshot = makeSnapshot("complete", "current-user");
const closedSnapshot = makeSnapshot("closed", "current-user");
const nonmemberSnapshot = makeSnapshot("lobby", "other-user");

assert.equal(
  getOnlineRoomResumeRoute(lobbySnapshot, "current-user"),
  "lobby",
  "lobby rooms should resume to the online lobby",
);
assert.equal(
  getOnlineRoomResumeRoute(roundSnapshot, "current-user"),
  "round",
  "active rooms should resume to the online round screen",
);
assert.equal(
  getOnlineRoomResumeRoute(completeSnapshot, "current-user"),
  "round",
  "completed games should resume to the online round/final-winner screen",
);
assert.equal(
  getOnlineRoomResumeRoute(closedSnapshot, "current-user"),
  undefined,
  "closed rooms should not be resumable",
);
assert.equal(
  getOnlineRoomResumeRoute(nonmemberSnapshot, "current-user"),
  undefined,
  "nonmembers should not be able to resume a room",
);
assert.equal(
  getOnlineRoomResumeFailureMessage(),
  "Could not verify your last online room. Check your connection and retry.",
  "failed resume lookups should show a retryable message",
);

console.log("Online room resume checks passed.");

function makeSnapshot(
  roomStatus: OnlineRoomSnapshot["room"]["status"],
  memberUserId: string,
): OnlineRoomSnapshot {
  return {
    currentRound:
      roomStatus === "lobby"
        ? undefined
        : {
            createdAt: "2026-07-21T10:00:00.000Z",
            id: "round-id",
            judgeMemberId: "member-id",
            roomId: "room-id",
            roundNumber: 1,
            status: "waiting_for_topic",
          },
    matchups: [],
    members: [
      {
        displayName: "Host",
        id: "member-id",
        joinedAt: "2026-07-21T10:00:00.000Z",
        joinOrder: 1,
        role: "host",
        roomId: "room-id",
        userId: memberUserId,
      },
    ],
    playbackEvents: [],
    presence: [],
    room: {
      createdAt: "2026-07-21T10:00:00.000Z",
      expiresAt: "2026-07-21T22:00:00.000Z",
      hostUserId: "current-user",
      id: "room-id",
      mode: "single_speaker",
      pointsToWin: 3,
      songsPerPlayer: 1,
      status: roomStatus,
    },
    scores: [],
    submissions: [],
  };
}
