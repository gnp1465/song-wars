import type { BracketMatchup, RoomMode } from "./game";
import type { MediaTrack } from "./media";

export type OnlineRoomStatus = "lobby" | "in_round" | "complete" | "closed" | "expired";
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
  gameWinnerMemberId?: string;
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
  winningSubmissionId?: string;
  winningMemberId?: string;
  createdAt: string;
}

export interface OnlineRoundSubmission {
  id: string;
  roomId: string;
  roundId: string;
  memberId: string;
  song: MediaTrack;
  submittedAt: string;
}

export interface OnlineRoomScore {
  roomId: string;
  memberId: string;
  points: number;
  updatedAt: string;
}

export interface OnlineRoomSnapshot {
  room: OnlineRoom;
  members: OnlineRoomMember[];
  presence: OnlineRoomMemberPresence[];
  currentRound?: OnlineRound;
  submissions: OnlineRoundSubmission[];
  matchups: BracketMatchup[];
  scores: OnlineRoomScore[];
}

export interface OnlineRoomSettingsUpdate {
  mode?: RoomMode;
  songsPerPlayer?: number;
  pointsToWin?: number;
}
