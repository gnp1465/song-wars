import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { OnlineRoomSnapshot } from "../types/onlineRoom";
import { reportAppError, reportAppEvent } from "../services/diagnostics/logger";
import {
  closeOnlineRoom,
  fetchOnlineRoomSnapshot,
  leaveOnlineRoom,
  prepareNextOnlineRound,
  playAgainOnlineRoom,
  removeOwnOnlineSubmission,
  removeOnlineRoomMember,
  scheduleOnlineMatchupPreview,
  selectOnlineMatchupWinner,
  startOnlineRoom,
  submitOnlineRoundSong,
  submitOnlineRoundTopic,
  subscribeToOnlineRoom,
  updateOnlineRoomSettings,
} from "../services/online/OnlineRoomService";
import type { OnlineRoomSettingsUpdate } from "../types/onlineRoom";
import type { MediaTrack } from "../types/media";

const ONLINE_ROOM_HEARTBEAT_MS = 15000;

export type OnlineRoomConnectionStatus = "idle" | "loading" | "connected" | "reconnecting" | "error";

export interface UseOnlineRoomResult {
  connectionStatus: OnlineRoomConnectionStatus;
  errorMessage?: string;
  isLoading: boolean;
  isMutating: boolean;
  lastSyncedAt?: number;
  refresh: () => Promise<void>;
  snapshot?: OnlineRoomSnapshot;
  clearError: () => void;
  closeRoom: () => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  removeOwnSubmission: (submissionId: string) => Promise<boolean>;
  scheduleMatchupPreview: (matchupId: string, submissionId: string) => Promise<boolean>;
  selectMatchupWinner: (matchupId: string, winnerSubmissionId: string) => Promise<boolean>;
  startRoom: () => Promise<boolean>;
  submitSong: (song: MediaTrack) => Promise<boolean>;
  submitTopic: (topic: string) => Promise<boolean>;
  prepareNextRound: () => Promise<boolean>;
  playAgain: () => Promise<boolean>;
  updateSettings: (update: OnlineRoomSettingsUpdate) => Promise<boolean>;
}

export function useOnlineRoom(
  roomId: string | undefined,
  currentUserId?: string,
): UseOnlineRoomResult {
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot | undefined>();
  const [isLoading, setIsLoading] = useState(Boolean(roomId));
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<OnlineRoomConnectionStatus>(
    roomId ? "loading" : "idle",
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>();
  const isMutatingRef = useRef(false);
  const snapshotRef = useRef<OnlineRoomSnapshot | undefined>(undefined);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | undefined>(undefined);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!roomId || !currentUserId) {
      return;
    }

    const hasSnapshot = Boolean(snapshotRef.current);
    const shouldShowInitialLoading = !options?.silent && !hasSnapshot;

    if (shouldShowInitialLoading) {
      setIsLoading(true);
      setConnectionStatus("loading");
    } else if (!options?.silent && hasSnapshot) {
      setConnectionStatus("reconnecting");
    }

    try {
      setSnapshot(await fetchOnlineRoomSnapshot(roomId));
      setErrorMessage(undefined);
      setConnectionStatus("connected");
      setLastSyncedAt(Date.now());
      reportAppEvent("online_room_snapshot_loaded", {
        area: "online-room",
        metadata: {
          hadSnapshot: hasSnapshot,
          silent: Boolean(options?.silent),
        },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load online room.");
      setConnectionStatus("error");
      reportAppError(error, {
        area: "online-room",
        detail: "Failed to refresh online room snapshot.",
        metadata: {
          hadSnapshot: hasSnapshot,
          silent: Boolean(options?.silent),
        },
      });
    } finally {
      if (shouldShowInitialLoading) {
        setIsLoading(false);
      }
    }
  }, [currentUserId, roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refresh({ silent: false });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (!roomId || !currentUserId) {
      return undefined;
    }

    const heartbeat = setInterval(() => {
      void refresh({ silent: true });
    }, ONLINE_ROOM_HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
    };
  }, [currentUserId, refresh, roomId]);

  useEffect(() => {
    if (!roomId || !snapshot) {
      return undefined;
    }

    const currentMember = snapshot.members.find((member) => member.userId === currentUserId);

    subscriptionRef.current = subscribeToOnlineRoom(
      roomId,
      currentMember?.id,
      () => {
        void refresh({ silent: true });
      },
      (presence) => {
        setSnapshot((currentSnapshot) =>
          currentSnapshot
            ? {
                ...currentSnapshot,
                presence,
              }
            : currentSnapshot,
        );
      },
    );

    return () => {
      void subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = undefined;
    };
  }, [currentUserId, refresh, roomId, snapshot?.room.id]);

  async function runMutation(
    actionName: string,
    action: () => Promise<OnlineRoomSnapshot | void>,
  ) {
    if (isMutatingRef.current) {
      reportAppEvent("online_room_action_ignored", {
        area: "online-room",
        metadata: {
          action: actionName,
          reason: "mutation_in_progress",
        },
      });
      return false;
    }

    isMutatingRef.current = true;
    setIsMutating(true);

    try {
      const nextSnapshot = await action();

      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }

      setErrorMessage(undefined);
      reportAppEvent("online_room_action_succeeded", {
        area: "online-room",
        metadata: {
          action: actionName,
        },
      });
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Online room action failed.");
      reportAppError(error, {
        area: "online-room",
        detail: "Online room action failed.",
        metadata: {
          action: actionName,
        },
      });
      return false;
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  }

  return {
    clearError: () => setErrorMessage(undefined),
    closeRoom: () =>
      runMutation("close_room", () => (roomId ? closeOnlineRoom(roomId) : Promise.resolve())),
    connectionStatus,
    errorMessage,
    isLoading,
    isMutating,
    lastSyncedAt,
    leaveRoom: () =>
      runMutation("leave_room", () => (roomId ? leaveOnlineRoom(roomId) : Promise.resolve())),
    refresh,
    removeMember: (memberId) =>
      runMutation("remove_member", () =>
        roomId ? removeOnlineRoomMember(roomId, memberId) : Promise.resolve(),
      ),
    removeOwnSubmission: (submissionId) =>
      runMutation("remove_own_submission", () =>
        roomId ? removeOwnOnlineSubmission(roomId, submissionId) : Promise.resolve(),
      ),
    prepareNextRound: () =>
      runMutation("prepare_next_round", () =>
        roomId ? prepareNextOnlineRound(roomId) : Promise.resolve(),
      ),
    playAgain: () =>
      runMutation("play_again", () => (roomId ? playAgainOnlineRoom(roomId) : Promise.resolve())),
    scheduleMatchupPreview: (matchupId, submissionId) =>
      runMutation("schedule_matchup_preview", () =>
        roomId ? scheduleOnlineMatchupPreview(roomId, matchupId, submissionId) : Promise.resolve(),
      ),
    selectMatchupWinner: (matchupId, winnerSubmissionId) =>
      runMutation("select_matchup_winner", () =>
        roomId
          ? selectOnlineMatchupWinner(roomId, matchupId, winnerSubmissionId)
          : Promise.resolve(),
      ),
    snapshot,
    startRoom: () =>
      runMutation("start_room", () => (roomId ? startOnlineRoom(roomId) : Promise.resolve())),
    submitSong: (song) =>
      runMutation("submit_song", () =>
        roomId ? submitOnlineRoundSong(roomId, song) : Promise.resolve(),
      ),
    submitTopic: (topic) =>
      runMutation("submit_topic", () =>
        roomId ? submitOnlineRoundTopic(roomId, topic) : Promise.resolve(),
      ),
    updateSettings: (update) =>
      runMutation("update_settings", () =>
        roomId ? updateOnlineRoomSettings(roomId, update) : Promise.resolve(),
      ),
  };
}
