export const ONLINE_ROOM_CODE_LENGTH = 6;

export function normalizeOnlineRoomCode(roomCode: string): string {
  return roomCode.replace(/\D/g, "").slice(0, ONLINE_ROOM_CODE_LENGTH);
}

export function isValidOnlineRoomCode(roomCode: string): boolean {
  return normalizeOnlineRoomCode(roomCode).length === ONLINE_ROOM_CODE_LENGTH;
}

export function getOnlineRoomCodeValidationMessage(
  roomCode: string,
): string | undefined {
  const normalizedRoomCode = normalizeOnlineRoomCode(roomCode);

  if (normalizedRoomCode.length === 0) {
    return "Enter the six-digit room code.";
  }

  if (normalizedRoomCode.length < ONLINE_ROOM_CODE_LENGTH) {
    return "Room codes are six digits.";
  }

  return undefined;
}
