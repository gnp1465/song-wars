import type { RoomMode } from "./game";

export type OnlineRoomStatus = "lobby" | "in_round" | "closed" | "expired";
export type OnlineRoomMemberRole = "host" | "guest";
export type OnlineRoomMemberPresenceStatus = "online" | "offline";
export type OnlineRoundStatus = "waiting_for_topic" | "submitting" | "judging" | "complete";

export interface OnlineRoom {
  id: string;
  code?: string;
  hostUserId: string;
  status: OnlineRoomStatus;
  mode: RoomMode;
  songsPerPlayer: number;
  pointsToWin: number;
  createdAt: string;
  expiresAt: string;
}

export interface OnlineRoomMember {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  role: OnlineRoomMemberRole;
  joinOrder: number;
  joinedAt: string;
}

export interface OnlineRoomMemberPresence {
  memberId: string;
  status: OnlineRoomMemberPresenceStatus;
}

export interface OnlineRound {
  id: string;
  roomId: string;
  roundNumber: number;
  judgeMemberId: string;
  status: OnlineRoundStatus;
  topic?: string;
  createdAt: string;
}

export interface OnlineRoomSnapshot {
  room: OnlineRoom;
  members: OnlineRoomMember[];
  presence: OnlineRoomMemberPresence[];
  currentRound?: OnlineRound;
}

export interface OnlineRoomSettingsUpdate {
  mode?: RoomMode;
  songsPerPlayer?: number;
  pointsToWin?: number;
}
