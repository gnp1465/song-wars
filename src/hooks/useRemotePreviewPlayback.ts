import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  createClockSyncEstimate,
  createRemotePlaybackPlan,
  getRemotePlaybackProgress,
} from "../services/audio/remotePlaybackSync";
import { precachePreview } from "../services/audio/previewCache";
import { fetchOnlineServerNowMs } from "../services/online/OnlineRoomService";
import type { OnlinePlaybackEvent } from "../types/onlineRoom";

export type RemotePreviewPhase =
  | "idle"
  | "preloading"
  | "scheduled"
  | "playing"
  | "finished"
  | "failed";

export interface RemotePreviewPlaybackState {
  errorMessage?: string;
  isLocked: boolean;
  phase: RemotePreviewPhase;
  progress: number;
  statusLabel: string;
}

export function useRemotePreviewPlayback(
  playbackEvent: OnlinePlaybackEvent | undefined,
  enabled: boolean,
): RemotePreviewPlaybackState {
  const soundRef = useRef<Audio.Sound | null>(null);
  const runIdRef = useRef(0);
  const [state, setState] = useState<RemotePreviewPlaybackState>({
    isLocked: false,
    phase: "idle",
    progress: 0,
    statusLabel: "No synced preview",
  });

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    async function unloadCurrentSound() {
      if (!soundRef.current) {
        return;
      }

      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    async function startRemotePreview() {
      await unloadCurrentSound();

      if (!enabled || !playbackEvent) {
        setState({
          isLocked: false,
          phase: "idle",
          progress: 0,
          statusLabel: "No synced preview",
        });
        return;
      }

      setState({
        isLocked: true,
        phase: "preloading",
        progress: 0,
        statusLabel: `Preloading ${playbackEvent.title}`,
      });

      try {
        const clientSentAtMs = Date.now();
        const serverNowMs = await fetchOnlineServerNowMs();
        const clientReceivedAtMs = Date.now();
        const clockEstimate = createClockSyncEstimate([
          {
            clientReceivedAtMs,
            clientSentAtMs,
            serverNowMs,
          },
        ]);
        const cachedUri = await precachePreview({
          previewUrl: playbackEvent.previewUrl,
          trackId: playbackEvent.trackId,
        });
        const plan = createRemotePlaybackPlan({
          clockOffsetMs: clockEstimate.clockOffsetMs,
          durationMs: playbackEvent.durationMs,
          localNowMs: Date.now(),
          serverStartAtMs: Date.parse(playbackEvent.serverStartAt),
        });

        if (runIdRef.current !== runId) {
          return;
        }

        setState({
          isLocked: true,
          phase: plan.isLate ? "playing" : "scheduled",
          progress: getRemotePlaybackProgress(
            plan.progressMsAtLocalNow,
            playbackEvent.durationMs,
          ),
          statusLabel: plan.isLate
            ? `Joining ${playbackEvent.title}`
            : `Synced preview starts in ${Math.ceil(plan.delayMs / 1000)}s`,
        });

        const startTimer = setTimeout(async () => {
          try {
            if (runIdRef.current !== runId) {
              return;
            }

            const startPlan = createRemotePlaybackPlan({
              clockOffsetMs: clockEstimate.clockOffsetMs,
              durationMs: playbackEvent.durationMs,
              localNowMs: Date.now(),
              serverStartAtMs: Date.parse(playbackEvent.serverStartAt),
            });
            const { sound } = await Audio.Sound.createAsync(
              { uri: cachedUri },
              {
                positionMillis: startPlan.progressMsAtLocalNow,
                shouldPlay: true,
              },
            );

            soundRef.current = sound;
            setState({
              isLocked: true,
              phase: "playing",
              progress: getRemotePlaybackProgress(
                startPlan.progressMsAtLocalNow,
                playbackEvent.durationMs,
              ),
              statusLabel: `Playing ${playbackEvent.title}`,
            });

            const progressInterval = setInterval(() => {
              const progressPlan = createRemotePlaybackPlan({
                clockOffsetMs: clockEstimate.clockOffsetMs,
                durationMs: playbackEvent.durationMs,
                localNowMs: Date.now(),
                serverStartAtMs: Date.parse(playbackEvent.serverStartAt),
              });
              const progress = getRemotePlaybackProgress(
                progressPlan.progressMsAtLocalNow,
                playbackEvent.durationMs,
              );

              setState((currentState) => ({
                ...currentState,
                progress,
              }));

              if (progress >= 1) {
                clearInterval(progressInterval);
                void unloadCurrentSound();
                setState({
                  isLocked: false,
                  phase: "finished",
                  progress: 1,
                  statusLabel: "Synced preview finished",
                });
              }
            }, 500);

            intervals.push(progressInterval);
          } catch (error) {
            if (runIdRef.current === runId) {
              setState({
                errorMessage: error instanceof Error ? error.message : "Synced preview failed.",
                isLocked: false,
                phase: "failed",
                progress: 0,
                statusLabel: "Synced preview failed",
              });
            }
          }
        }, plan.delayMs);

        timers.push(startTimer);
      } catch (error) {
        if (runIdRef.current === runId) {
          setState({
            errorMessage: error instanceof Error ? error.message : "Synced preview failed.",
            isLocked: false,
            phase: "failed",
            progress: 0,
            statusLabel: "Synced preview failed",
          });
        }
      }
    }

    void startRemotePreview();

    return () => {
      runIdRef.current += 1;
      timers.forEach((timer) => clearTimeout(timer));
      intervals.forEach((interval) => clearInterval(interval));
      void unloadCurrentSound();
    };
  }, [enabled, playbackEvent?.id]);

  return state;
}
