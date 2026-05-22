import type { MediaTrack } from "./media";

export type RoomMode = "remote" | "single_speaker";

export type RoundStatus =
  | "waiting_for_topic"
  | "collecting_submissions"
  | "bracket_ready"
  | "judging"
  | "complete";

export type MatchupStatus = "pending" | "ready" | "complete";

export interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  isGuest: boolean;
}

export interface RoomSettings {
  mode: RoomMode;
  songsPerPlayer: number;
  duplicateBlockingEnabled: boolean;
  anonymousJudgingEnabled: boolean;
}

export interface SongSubmission {
  id: string;
  playerId: string;
  roundId: string;
  song: MediaTrack;
  submittedAtMs: number;
}

export interface MatchupEntry {
  submissionId: string;
  playerId: string;
  song: MediaTrack;
}

export interface BracketMatchup {
  id: string;
  roundNumber: number;
  position: number;
  status: MatchupStatus;
  left?: MatchupEntry;
  right?: MatchupEntry;
  winnerSubmissionId?: string;
  hasBye: boolean;
}

export interface Round {
  id: string;
  judgePlayerId: string;
  topic?: string;
  status: RoundStatus;
  submissions: SongSubmission[];
  bracket: BracketMatchup[];
}
