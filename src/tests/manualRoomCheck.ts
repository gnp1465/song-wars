import {
  addGuestToRoom,
  canStartRoom,
  createLocalRoom,
  hasDuplicateDisplayName,
  removeGuestFromRoom,
  updateRoomMode,
  updateSongsPerPlayer,
} from "../services/game/room.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const room = createLocalRoom({
  hostName: "Gus",
  roomCode: "7392",
  roomId: "room-demo",
  createdAtMs: 1000,
});

assert(room.players.length === 1, "A new room should start with only the host.");
assert(room.hostPlayerId === "player-host", "The host player id should be stored on the room.");
assert(room.settings.duplicateBlockingEnabled, "Duplicate song blocking should be on by default.");
assert(!canStartRoom(room), "A room with one player should not be startable.");

const roomWithGuests = addGuestToRoom(
  addGuestToRoom(room, { displayName: "Maya" }),
  { displayName: "Jay" },
);

assert(roomWithGuests.players.length === 3, "Adding two guests should create a three-player room.");
assert(canStartRoom(roomWithGuests), "A room with at least three players should be startable.");
assert(
  hasDuplicateDisplayName(roomWithGuests, "  maya  "),
  "Duplicate display name checks should ignore casing and outside spaces.",
);

const roomWithoutJay = removeGuestFromRoom(roomWithGuests, "player-guest-2");

assert(roomWithoutJay.players.length === 2, "Removing a guest should remove only that guest.");
assert(
  roomWithoutJay.players.some((player) => player.isHost),
  "Removing a guest should never remove the host.",
);

const remoteRoom = updateRoomMode(roomWithGuests, "remote");

assert(remoteRoom.settings.mode === "remote", "Room mode should update to remote.");
assert(roomWithGuests.settings.mode === "single_speaker", "Updating room mode should not mutate the old room.");

const clampedHighRoom = updateSongsPerPlayer(roomWithGuests, 99);
const clampedLowRoom = updateSongsPerPlayer(roomWithGuests, -10);

assert(clampedHighRoom.settings.songsPerPlayer === 3, "Songs per player should clamp to the max.");
assert(clampedLowRoom.settings.songsPerPlayer === 1, "Songs per player should clamp to the min.");

console.log("Room model checks passed.");
