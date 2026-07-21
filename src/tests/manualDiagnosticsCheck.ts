import assert from "node:assert/strict";
import { redactDiagnosticText } from "../services/diagnostics/logger.ts";

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

console.log("Diagnostics redaction checks passed.");
