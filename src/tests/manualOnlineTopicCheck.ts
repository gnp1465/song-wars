import assert from "node:assert/strict";
import {
  canSubmitOnlineTopic,
  MAX_ONLINE_TOPIC_LENGTH,
  normalizeOnlineTopic,
} from "../services/online/onlineRoundTopic.ts";

assert.equal(normalizeOnlineTopic("  Beach vibes  "), "Beach vibes");
assert.equal(
  canSubmitOnlineTopic({
    currentMemberId: "judge-member",
    isMutating: false,
    judgeMemberId: "judge-member",
    roundStatus: "waiting_for_topic",
    topicInput: "Beach vibes",
  }),
  true,
  "current judge should submit a valid topic while the round waits for a topic",
);
assert.equal(
  canSubmitOnlineTopic({
    currentMemberId: "guest-member",
    isMutating: false,
    judgeMemberId: "judge-member",
    roundStatus: "waiting_for_topic",
    topicInput: "Beach vibes",
  }),
  false,
  "non-judges should not submit the topic",
);
assert.equal(
  canSubmitOnlineTopic({
    currentMemberId: "judge-member",
    isMutating: false,
    judgeMemberId: "judge-member",
    roundStatus: "submitting",
    topicInput: "Beach vibes",
  }),
  false,
  "topic should lock after the round leaves topic setup",
);
assert.equal(
  canSubmitOnlineTopic({
    currentMemberId: "judge-member",
    isMutating: false,
    judgeMemberId: "judge-member",
    roundStatus: "waiting_for_topic",
    topicInput: "",
  }),
  false,
  "blank topics should not be submitted",
);
assert.equal(
  canSubmitOnlineTopic({
    currentMemberId: "judge-member",
    isMutating: false,
    judgeMemberId: "judge-member",
    roundStatus: "waiting_for_topic",
    topicInput: "x".repeat(MAX_ONLINE_TOPIC_LENGTH + 1),
  }),
  false,
  "topics should respect the online topic length limit",
);

console.log("Online topic checks passed.");
