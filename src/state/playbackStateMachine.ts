export type PlaybackStateName =
  | "idle"
  | "preparing_stream"
  | "scheduled"
  | "playing_locked"
  | "finished"
  | "failed_preview";

export interface PlaybackState {
  name: PlaybackStateName;
  matchId?: string;
  trackId?: string;
  serverStartAtMs?: number;
  durationMs?: number;
  errorMessage?: string;
}

export type PlaybackEvent =
  | {
      type: "prepare";
      matchId: string;
      trackId: string;
    }
  | {
      type: "schedule";
      serverStartAtMs: number;
      durationMs: number;
    }
  | {
      type: "start";
    }
  | {
      type: "finish";
    }
  | {
      type: "fail";
      errorMessage: string;
    }
  | {
      type: "reset";
    };

export const initialPlaybackState: PlaybackState = {
  name: "idle",
};

export function isPlaybackUiLocked(state: PlaybackState): boolean {
  return state.name === "scheduled" || state.name === "playing_locked";
}

export function reducePlaybackState(
  state: PlaybackState,
  event: PlaybackEvent,
): PlaybackState {
  switch (event.type) {
    case "prepare":
      return {
        name: "preparing_stream",
        matchId: event.matchId,
        trackId: event.trackId,
      };

    case "schedule":
      if (state.name !== "preparing_stream") {
        return state;
      }

      return {
        ...state,
        name: "scheduled",
        serverStartAtMs: event.serverStartAtMs,
        durationMs: event.durationMs,
      };

    case "start":
      if (state.name !== "scheduled") {
        return state;
      }

      return {
        ...state,
        name: "playing_locked",
      };

    case "finish":
      if (state.name !== "playing_locked") {
        return state;
      }

      return {
        ...state,
        name: "finished",
      };

    case "fail":
      return {
        ...state,
        name: "failed_preview",
        errorMessage: event.errorMessage,
      };

    case "reset":
      return initialPlaybackState;

    default:
      return state;
  }
}
