import type { SongSubmission } from "../../types/game";
import type { MediaTrack } from "../../types/media";

export interface CreateSongSubmissionOptions {
  id: string;
  playerId: string;
  roundId: string;
  song: MediaTrack;
  submittedAtMs?: number;
}

export function createSongSubmission({
  id,
  playerId,
  roundId,
  song,
  submittedAtMs,
}: CreateSongSubmissionOptions): SongSubmission {
  return {
    id,
    playerId,
    roundId,
    song,
    submittedAtMs: submittedAtMs ?? Date.now(),
  };
}

export function hasDuplicateSongSubmission(
  submissions: SongSubmission[],
  song: MediaTrack,
): boolean {
  return submissions.some((submission) => getSongKey(submission.song) === getSongKey(song));
}

export function getSongKey(song: MediaTrack): string {
  const normalizedTitle = song.title.trim().toLowerCase();
  const normalizedArtists = song.artists
    .map((artist) => artist.trim().toLowerCase())
    .join(",");

  return `${normalizedTitle}:${normalizedArtists}`;
}
