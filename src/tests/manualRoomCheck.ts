import {
  addGuestToRoom,
  canStartRoom,
  createLocalRoom,
  getRoomStatusLabel,
  hasDuplicateDisplayName,
  removeGuestFromRoom,
  startRoom,
  updatePointsToWin,
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
assert(room.settings.pointsToWin === 3, "A new room should default to first player to 3 points.");
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
const clampedHighPointsRoom = updatePointsToWin(roomWithGuests, 99);
const clampedLowPointsRoom = updatePointsToWin(roomWithGuests, -10);

assert(clampedHighRoom.settings.songsPerPlayer === 3, "Songs per player should clamp to the max.");
assert(clampedLowRoom.settings.songsPerPlayer === 1, "Songs per player should clamp to the min.");
assert(clampedHighPointsRoom.settings.pointsToWin === 7, "Points to win should clamp to the max.");
assert(clampedLowPointsRoom.settings.pointsToWin === 1, "Points to win should clamp to the min.");

const unstartableRoom = startRoom(room);
const startedRoom = startRoom(roomWithGuests);

assert(unstartableRoom.status === "lobby", "A room without enough players should stay in the lobby.");
assert(startedRoom.status === "in_round", "A startable room should move into the round state.");
assert(getRoomStatusLabel(room.status) === "Lobby", "Lobby status should have a readable label.");
assert(getRoomStatusLabel(startedRoom.status) === "In Round", "In-round status should have a readable label.");

console.log("Room model checks passed.");
