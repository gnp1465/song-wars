import assert from "node:assert/strict";
import {
  getOnlineRoundSubtitle,
  getOnlineRoundTitle,
} from "../services/online/onlineRoundDisplay.ts";

assert.equal(getOnlineRoundTitle(undefined), "Topic setup");
assert.equal(getOnlineRoundSubtitle(undefined), "The judge sets the prompt for this round.");
assert.equal(getOnlineRoundTitle("waiting_for_topic"), "Topic setup");
assert.equal(getOnlineRoundSubtitle("waiting_for_topic"), "The judge sets the prompt for this round.");
assert.equal(getOnlineRoundTitle("submitting"), "Submissions");
assert.equal(
  getOnlineRoundSubtitle("submitting"),
  "Contestants pick songs for the locked topic.",
);
assert.equal(getOnlineRoundTitle("judging"), "Judging next");
assert.equal(getOnlineRoundSubtitle("judging"), "The submission phase is complete.");
assert.equal(getOnlineRoundTitle("complete"), "Round complete");
assert.equal(
  getOnlineRoundSubtitle("complete"),
  "Scores are updated and the next judge is set.",
);

console.log("Online round display checks passed.");
