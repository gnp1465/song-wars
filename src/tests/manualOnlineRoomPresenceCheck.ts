import assert from "node:assert/strict";
import {
  getOnlineMemberPresenceLabel,
  getOnlineMemberPresenceStatus,
  getOnlinePresenceSummary,
} from "../services/online/onlineRoomPresence.ts";
import type { OnlineRoomSnapshot } from "../types/onlineRoom.ts";

const snapshot = makeSnapshot();

assert.equal(
  getOnlineMemberPresenceStatus(snapshot, snapshot.members[0]),
  "online",
  "members tracked in presence should be online",
);
assert.equal(
  getOnlineMemberPresenceStatus(snapshot, snapshot.members[1]),
  "offline",
  "missing presence should count as offline",
);
assert.equal(
  getOnlineMemberPresenceLabel(snapshot, snapshot.members[0], {
    currentMemberId: snapshot.members[0].id,
    presenceHasSynced: false,
  }),
  "This device",
  "the current member should be labeled as the current device before presence syncs",
);
assert.equal(
  getOnlineMemberPresenceLabel(snapshot, snapshot.members[1], {
    currentMemberId: snapshot.members[0].id,
    presenceHasSynced: false,
  }),
  "Joined",
  "members should not show as offline before presence has synced",
);
assert.equal(
  getOnlineMemberPresenceLabel(snapshot, snapshot.members[1], {
    currentMemberId: snapshot.members[0].id,
    presenceHasSynced: true,
  }),
  "Offline",
  "missing members can show offline after presence has synced",
);
assert.deepEqual(
  getOnlinePresenceSummary(snapshot),
  {
    label: "1/2 online",
    onlineCount: 1,
    totalCount: 2,
  },
  "presence summary should count online members against total members",
);

console.log("Online room presence checks passed.");

function makeSnapshot(): OnlineRoomSnapshot {
  return {
    matchups: [],
    members: [
      {
        displayName: "Host",
        id: "host-member",
        joinedAt: "2026-07-21T10:00:00.000Z",
        joinOrder: 1,
        role: "host",
        roomId: "room-id",
        userId: "host-user",
      },
      {
        displayName: "Guest",
        id: "guest-member",
        joinedAt: "2026-07-21T10:01:00.000Z",
        joinOrder: 2,
        role: "guest",
        roomId: "room-id",
        userId: "guest-user",
      },
    ],
    playbackEvents: [],
    presence: [
      {
        memberId: "host-member",
        status: "online",
      },
    ],
    room: {
      createdAt: "2026-07-21T10:00:00.000Z",
      expiresAt: "2026-07-21T22:00:00.000Z",
      hostUserId: "host-user",
      id: "room-id",
      mode: "single_speaker",
      pointsToWin: 3,
      songsPerPlayer: 1,
      status: "lobby",
    },
    scores: [],
    submissions: [],
  };
}
