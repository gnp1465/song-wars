import type { OnlinePlaybackEvent } from "../../types/onlineRoom";

export function getLatestOnlinePlaybackEvent(
  playbackEvents: OnlinePlaybackEvent[],
): OnlinePlaybackEvent | undefined {
  return [...playbackEvents].sort(
    (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
  )[0];
}

export function isOnlinePlaybackEventActive(
  playbackEvent: OnlinePlaybackEvent | undefined,
  nowMs = Date.now(),
): boolean {
  if (!playbackEvent) {
    return false;
  }

  const startAtMs = Date.parse(playbackEvent.serverStartAt);
  const endAtMs = startAtMs + playbackEvent.durationMs;

  return nowMs <= endAtMs;
}
