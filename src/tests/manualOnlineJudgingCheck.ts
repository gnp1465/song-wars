import assert from "node:assert/strict";
import {
  canJudgeOnlineMatchup,
  getActiveOnlineMatchup,
} from "../services/online/onlineRoundJudging.ts";
import type { BracketMatchup } from "../types/game.ts";
import type { OnlineRoomMember, OnlineRound } from "../types/onlineRoom.ts";

const judge = makeMember("judge-member");
const contestant = makeMember("contestant-member");
const judgingRound: OnlineRound = {
  createdAt: "2026-07-19T00:00:00.000Z",
  id: "round-id",
  judgeMemberId: judge.id,
  roomId: "room-id",
  roundNumber: 1,
  status: "judging",
  topic: "Beach vibes",
};
const matchups: BracketMatchup[] = [
  makeMatchup("matchup-complete", "complete", 1, 1),
  makeMatchup("matchup-ready", "ready", 1, 2),
  makeMatchup("matchup-pending", "pending", 2, 1),
];

assert.equal(
  getActiveOnlineMatchup(matchups)?.id,
  "matchup-ready",
  "active judging matchup should be the first ready matchup in bracket order",
);
assert.equal(
  canJudgeOnlineMatchup({
    currentMember: judge,
    currentRound: judgingRound,
    isMutating: false,
    matchups,
  }),
  true,
  "the current judge should pick winners while the round is judging",
);
assert.equal(
  canJudgeOnlineMatchup({
    currentMember: contestant,
    currentRound: judgingRound,
    isMutating: false,
    matchups,
  }),
  false,
  "contestants should not pick matchup winners",
);
assert.equal(
  canJudgeOnlineMatchup({
    currentMember: judge,
    currentRound: { ...judgingRound, status: "complete" },
    isMutating: false,
    matchups,
  }),
  false,
  "winner picking should stop after the round is complete",
);

console.log("Online judging checks passed.");

function makeMember(id: string): OnlineRoomMember {
  return {
    displayName: id,
    id,
    joinedAt: "2026-07-19T00:00:00.000Z",
    joinOrder: 1,
    role: "guest",
    roomId: "room-id",
    userId: `${id}-user`,
  };
}

function makeMatchup(
  id: string,
  status: BracketMatchup["status"],
  roundNumber: number,
  position: number,
): BracketMatchup {
  return {
    hasBye: false,
    id,
    position,
    roundNumber,
    status,
  };
}
