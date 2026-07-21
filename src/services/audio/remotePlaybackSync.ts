import { estimateClockOffsetMs, type ClockOffsetSample } from "./playbackScheduler.ts";

export interface ClockSyncEstimate {
  clockOffsetMs: number;
  roundTripMs: number;
  sampleCount: number;
}

export interface RemotePlaybackPlanOptions {
  clockOffsetMs: number;
  durationMs: number;
  localNowMs: number;
  preloadLeadMs?: number;
  serverStartAtMs: number;
}

export interface RemotePlaybackPlan {
  delayMs: number;
  isLate: boolean;
  localPreloadAtMs: number;
  localStartAtMs: number;
  progressMsAtLocalNow: number;
  uiUnlockAtMs: number;
}

export function createClockSyncEstimate(samples: ClockOffsetSample[]): ClockSyncEstimate {
  if (samples.length === 0) {
    return {
      clockOffsetMs: 0,
      roundTripMs: 0,
      sampleCount: 0,
    };
  }

  const bestSample = [...samples].sort(
    (first, second) => getRoundTripMs(first) - getRoundTripMs(second),
  )[0];

  return {
    clockOffsetMs: estimateClockOffsetMs(bestSample),
    roundTripMs: getRoundTripMs(bestSample),
    sampleCount: samples.length,
  };
}

export function createRemotePlaybackPlan({
  clockOffsetMs,
  durationMs,
  localNowMs,
  preloadLeadMs = 5000,
  serverStartAtMs,
}: RemotePlaybackPlanOptions): RemotePlaybackPlan {
  const localStartAtMs = serverStartAtMs - clockOffsetMs;
  const delayMs = Math.max(0, localStartAtMs - localNowMs);
  const progressMsAtLocalNow = clamp(localNowMs - localStartAtMs, 0, durationMs);

  return {
    delayMs,
    isLate: localStartAtMs <= localNowMs,
    localPreloadAtMs: Math.max(localNowMs, localStartAtMs - preloadLeadMs),
    localStartAtMs,
    progressMsAtLocalNow,
    uiUnlockAtMs: localStartAtMs + durationMs,
  };
}

function getRoundTripMs(sample: ClockOffsetSample): number {
  return sample.clientReceivedAtMs - sample.clientSentAtMs;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
