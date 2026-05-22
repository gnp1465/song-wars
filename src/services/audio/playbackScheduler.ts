export interface ClockOffsetSample {
  serverNowMs: number;
  clientSentAtMs: number;
  clientReceivedAtMs: number;
}

export interface ScheduledPlaybackTarget {
  serverStartAtMs: number;
  serverNowMs: number;
  localNowMs?: number;
  clockOffsetMs?: number;
}

export interface PlaybackSchedule {
  localStartAtMs: number;
  delayMs: number;
  isLate: boolean;
}

export function estimateClockOffsetMs(sample: ClockOffsetSample): number {
  const roundTripMs = sample.clientReceivedAtMs - sample.clientSentAtMs;
  const estimatedServerAtClientReceiveMs = sample.serverNowMs + roundTripMs / 2;

  return estimatedServerAtClientReceiveMs - sample.clientReceivedAtMs;
}

export function createPlaybackSchedule(target: ScheduledPlaybackTarget): PlaybackSchedule {
  const localNowMs = target.localNowMs ?? Date.now();
  const localStartAtMs =
    target.clockOffsetMs === undefined
      ? localNowMs + (target.serverStartAtMs - target.serverNowMs)
      : target.serverStartAtMs - target.clockOffsetMs;
  const delayMs = Math.max(0, localStartAtMs - localNowMs);

  return {
    localStartAtMs,
    delayMs,
    isLate: localStartAtMs <= localNowMs,
  };
}
