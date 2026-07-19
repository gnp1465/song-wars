import assert from "node:assert/strict";
import {
  canSubmitOnlineSong,
  getOnlineSongsRemaining,
  getOnlineSubmissionCountForMember,
} from "../services/online/onlineRoundSubmissions.ts";
import type {
  OnlineRoomMember,
  OnlineRound,
  OnlineRoundSubmission,
} from "../types/onlineRoom.ts";

const judge = makeMember("judge-member");
const contestant = makeMember("contestant-member");
const submittingRound: OnlineRound = {
  createdAt: "2026-07-19T00:00:00.000Z",
  id: "round-id",
  judgeMemberId: judge.id,
  roomId: "room-id",
  roundNumber: 1,
  status: "submitting",
  topic: "Beach vibes",
};
const contestantSubmission = makeSubmission("submission-1", contestant.id);

assert.equal(
  getOnlineSubmissionCountForMember([contestantSubmission], contestant.id),
  1,
  "submission count should count only the selected member",
);
assert.equal(
  getOnlineSongsRemaining({
    currentMember: contestant,
    songsPerPlayer: 2,
    submissions: [contestantSubmission],
  }),
  1,
  "songs remaining should subtract existing submissions",
);
assert.equal(
  canSubmitOnlineSong({
    currentMember: contestant,
    currentRound: submittingRound,
    isMutating: false,
    songsPerPlayer: 2,
    submissions: [contestantSubmission],
  }),
  true,
  "contestants should submit while the round is accepting submissions",
);
assert.equal(
  canSubmitOnlineSong({
    currentMember: judge,
    currentRound: submittingRound,
    isMutating: false,
    songsPerPlayer: 2,
    submissions: [],
  }),
  false,
  "judges should not submit songs",
);
assert.equal(
  canSubmitOnlineSong({
    currentMember: contestant,
    currentRound: { ...submittingRound, status: "judging" },
    isMutating: false,
    songsPerPlayer: 2,
    submissions: [contestantSubmission],
  }),
  false,
  "submissions should stop after the round leaves submitting",
);

console.log("Online submission checks passed.");

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

function makeSubmission(id: string, memberId: string): OnlineRoundSubmission {
  return {
    id,
    memberId,
    roomId: "room-id",
    roundId: "round-id",
    song: {
      artists: ["Artist"],
      attribution: [],
      capabilities: ["stream_preview"],
      id: "track-id",
      preview: {
        providerId: "apple_itunes",
        streamUrl: "https://example.com/preview.m4a",
      },
      providerRefs: [],
      resolutionStatus: "resolved",
      title: "Song",
    },
    submittedAt: "2026-07-19T00:00:00.000Z",
  };
}
