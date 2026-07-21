import assert from "node:assert/strict";
import {
  redactDiagnosticText,
  reportAppError,
  reportAppEvent,
  setDiagnosticSink,
  type DiagnosticRecord,
} from "../services/diagnostics/logger.ts";

const fakeJwt = "eyJabc.def456.ghi789";
const rawText = [
  "Request failed",
  "Authorization: Bearer test-secret-token",
  `jwt=${fakeJwt}`,
  "access_token=abc123",
  "refresh_token=def456",
  "apikey=public-but-still-noisy",
  "https://songwars-dev.supabase.co/rest/v1/rooms",
].join(" ");

const redactedText = redactDiagnosticText(rawText);

assert.equal(redactedText.includes(fakeJwt), false);
assert.equal(redactedText.includes("test-secret-token"), false);
assert.equal(redactedText.includes("abc123"), false);
assert.equal(redactedText.includes("def456"), false);
assert.equal(redactedText.includes("public-but-still-noisy"), false);
assert.equal(redactedText.includes("songwars-dev.supabase.co"), false);
assert.equal(redactedText.includes("Bearer [redacted]"), true);
assert.equal(redactedText.includes("access_token=[redacted]"), true);
assert.equal(redactedText.includes("refresh_token=[redacted]"), true);
assert.equal(redactedText.includes("apikey=[redacted]"), true);
assert.equal(redactedText.includes("https://[supabase-project].supabase.co"), true);

const records: DiagnosticRecord[] = [];
const restoreSink = setDiagnosticSink({
  record(record) {
    records.push(record);
  },
});

reportAppEvent("online_room_resume_available", {
  area: "resume",
  detail: "room=https://songwars-dev.supabase.co/rest/v1/rooms",
  metadata: {
    access_token: "abc123",
    playerCount: 3,
    route: "round",
  },
});
reportAppEvent("online_room_action_succeeded", {
  area: "online-room",
  metadata: {
    action: "submit_topic",
  },
});
reportAppEvent("online_room_action_ignored", {
  area: "online-room",
  metadata: {
    action: "submit_topic",
    reason: "mutation_in_progress",
  },
});
reportAppError(new Error(`Failed with jwt=${fakeJwt}`), {
  area: "online-room",
  metadata: {
    service_role: "never-log-this",
  },
});
restoreSink();

assert.equal(records.length, 4);
assert.equal(records[0].kind, "event");
assert.equal(records[0].detail?.includes("songwars-dev.supabase.co"), false);
assert.equal(records[0].metadata?.access_token, "[redacted]");
assert.equal(records[0].metadata?.playerCount, 3);
assert.equal(records[1].kind, "event");
assert.equal(records[1].metadata?.action, "submit_topic");
assert.equal(records[2].kind, "event");
assert.equal(records[2].metadata?.reason, "mutation_in_progress");
assert.equal(records[3].kind, "error");
assert.equal(records[3].message.includes(fakeJwt), false);
assert.equal(records[3].metadata?.service_role, "[redacted]");

console.log("Diagnostics redaction checks passed.");
