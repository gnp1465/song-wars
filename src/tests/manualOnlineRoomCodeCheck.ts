import assert from "node:assert/strict";
import {
  getOnlineRoomCodeValidationMessage,
  isValidOnlineRoomCode,
  normalizeOnlineRoomCode,
  ONLINE_ROOM_CODE_LENGTH,
} from "../services/online/onlineRoomCode.ts";

assert.equal(normalizeOnlineRoomCode("123456"), "123456");
assert.equal(normalizeOnlineRoomCode(" 12-34 56 "), "123456");
assert.equal(normalizeOnlineRoomCode("1234567"), "123456");
assert.equal(normalizeOnlineRoomCode("abc"), "");
assert.equal(isValidOnlineRoomCode("123456"), true);
assert.equal(isValidOnlineRoomCode("12345"), false);
assert.equal(isValidOnlineRoomCode("room 123456"), true);
assert.equal(ONLINE_ROOM_CODE_LENGTH, 6);
assert.equal(
  getOnlineRoomCodeValidationMessage(""),
  "Enter the six-digit room code.",
);
assert.equal(
  getOnlineRoomCodeValidationMessage("123"),
  "Room codes are six digits.",
);
assert.equal(getOnlineRoomCodeValidationMessage("123456"), undefined);

console.log("Online room-code checks passed.");
