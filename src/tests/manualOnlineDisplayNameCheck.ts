import assert from "node:assert/strict";
import {
  getOnlineDisplayNameValidationMessage,
  hasOnlineDisplayName,
  isValidOnlineDisplayName,
  MAX_ONLINE_DISPLAY_NAME_LENGTH,
  normalizeOnlineDisplayName,
} from "../services/online/displayName.ts";

assert.equal(normalizeOnlineDisplayName("  Dan  "), "Dan");
assert.equal(normalizeOnlineDisplayName("\nMaya\t"), "Maya");
assert.equal(hasOnlineDisplayName("  "), false);
assert.equal(hasOnlineDisplayName(" Jay "), true);
assert.equal(isValidOnlineDisplayName(" Jay "), true);
assert.equal(isValidOnlineDisplayName("  "), false);
assert.equal(
  getOnlineDisplayNameValidationMessage("  "),
  "Enter a display name.",
  "blank display names should explain why create/join is disabled",
);
assert.equal(
  isValidOnlineDisplayName("x".repeat(MAX_ONLINE_DISPLAY_NAME_LENGTH)),
  true,
  "display names at the backend limit should be valid",
);
assert.equal(
  isValidOnlineDisplayName("x".repeat(MAX_ONLINE_DISPLAY_NAME_LENGTH + 1)),
  false,
  "display names over the backend limit should be blocked on the client",
);
assert.equal(
  getOnlineDisplayNameValidationMessage("x".repeat(MAX_ONLINE_DISPLAY_NAME_LENGTH + 1)),
  `Display names must be ${MAX_ONLINE_DISPLAY_NAME_LENGTH} characters or less.`,
);

console.log("Online display-name checks passed.");
