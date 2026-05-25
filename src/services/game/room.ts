import type { Player, Room, RoomMode, RoomSettings } from "../../types/game";

export interface CreateLocalRoomOptions {
  hostName: string;
  roomCode: string;
  roomId: string;
  createdAtMs?: number;
}

export interface AddGuestOptions {
  displayName: string;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  mode: "single_speaker",
  songsPerPlayer: 1,
  duplicateBlockingEnabled: true,
  anonymousJudgingEnabled: false,
};

export function createLocalRoom(options: CreateLocalRoomOptions): Room {
  const hostPlayer = createHostPlayer(options.hostName);

  return {
    id: options.roomId,
    code: options.roomCode,
    hostPlayerId: hostPlayer.id,
    players: [hostPlayer],
    settings: DEFAULT_ROOM_SETTINGS,
    status: "lobby",
    createdAtMs: options.createdAtMs ?? Date.now(),
  };
}

export function addGuestToRoom(room: Room, options: AddGuestOptions): Room {
  const displayName = options.displayName.trim();

  if (!displayName) {
    return room;
  }

  const guestPlayer: Player = {
    id: `player-guest-${room.players.length}`,
    displayName,
    isHost: false,
    isGuest: true,
  };

  return {
    ...room,
    players: [...room.players, guestPlayer],
  };
}

export function removeGuestFromRoom(room: Room, guestPlayerId: string): Room {
  return {
    ...room,
    players: room.players.filter(
      (player) => player.isHost || player.id !== guestPlayerId,
    ),
  };
}

export function updateRoomMode(room: Room, mode: RoomMode): Room {
  return {
    ...room,
    settings: {
      ...room.settings,
      mode,
    },
  };
}

export function updateSongsPerPlayer(room: Room, songsPerPlayer: number): Room {
  return {
    ...room,
    settings: {
      ...room.settings,
      songsPerPlayer: clampSongsPerPlayer(songsPerPlayer),
    },
  };
}

export function startRoom(room: Room): Room {
  if (!canStartRoom(room)) {
    return room;
  }

  return {
    ...room,
    status: "in_round",
  };
}

export function canStartRoom(room: Room): boolean {
  return room.players.length >= 3;
}

export function hasDuplicateDisplayName(room: Room, displayName: string): boolean {
  const normalizedDisplayName = normalizeDisplayName(displayName);

  return room.players.some(
    (player) => normalizeDisplayName(player.displayName) === normalizedDisplayName,
  );
}

function createHostPlayer(hostName: string): Player {
  return {
    id: "player-host",
    displayName: hostName.trim() || "Host",
    isHost: true,
    isGuest: false,
  };
}

function clampSongsPerPlayer(songsPerPlayer: number): number {
  return Math.min(3, Math.max(1, songsPerPlayer));
}

function normalizeDisplayName(displayName: string): string {
  return displayName.trim().toLowerCase();
}
