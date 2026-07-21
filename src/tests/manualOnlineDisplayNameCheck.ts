import assert from "node:assert/strict";
import {
  hasOnlineDisplayName,
  normalizeOnlineDisplayName,
} from "../services/online/displayName.ts";

assert.equal(normalizeOnlineDisplayName("  Dan  "), "Dan");
assert.equal(normalizeOnlineDisplayName("\nMaya\t"), "Maya");
assert.equal(hasOnlineDisplayName("  "), false);
assert.equal(hasOnlineDisplayName(" Jay "), true);

console.log("Online display-name checks passed.");
