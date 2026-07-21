import assert from "node:assert/strict";
import { getOnlineRoomExpiryLabel } from "../services/online/onlineRoomExpiry.ts";

const nowMs = Date.parse("2026-07-21T10:00:00.000Z");

assert.equal(
  getOnlineRoomExpiryLabel({ expiresAt: "2026-07-21T10:45:00.000Z" }, nowMs),
  "Expires in 45m",
);
assert.equal(
  getOnlineRoomExpiryLabel({ expiresAt: "2026-07-21T12:00:00.000Z" }, nowMs),
  "Expires in 2h",
);
assert.equal(
  getOnlineRoomExpiryLabel({ expiresAt: "2026-07-21T12:15:00.000Z" }, nowMs),
  "Expires in 2h 15m",
);
assert.equal(
  getOnlineRoomExpiryLabel({ expiresAt: "2026-07-21T09:59:00.000Z" }, nowMs),
  "Expired",
);
assert.equal(getOnlineRoomExpiryLabel({ expiresAt: "not-a-date" }, nowMs), "Temporary room");

console.log("Online room expiry checks passed.");
