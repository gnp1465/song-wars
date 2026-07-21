import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { OnlineRoomSnapshot } from "../types/onlineRoom";
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
  closeRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  removeOwnSubmission: (submissionId: string) => Promise<void>;
  scheduleMatchupPreview: (matchupId: string, submissionId: string) => Promise<void>;
  selectMatchupWinner: (matchupId: string, winnerSubmissionId: string) => Promise<void>;
  startRoom: () => Promise<void>;
  submitSong: (song: MediaTrack) => Promise<void>;
  submitTopic: (topic: string) => Promise<void>;
  prepareNextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
  updateSettings: (update: OnlineRoomSettingsUpdate) => Promise<void>;
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load online room.");
      setConnectionStatus("error");
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

  async function runMutation(action: () => Promise<OnlineRoomSnapshot | void>) {
    setIsMutating(true);

    try {
      const nextSnapshot = await action();

      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }

      setErrorMessage(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Online room action failed.");
    } finally {
      setIsMutating(false);
    }
  }

  return {
    clearError: () => setErrorMessage(undefined),
    closeRoom: () => runMutation(() => (roomId ? closeOnlineRoom(roomId) : Promise.resolve())),
    connectionStatus,
    errorMessage,
    isLoading,
    isMutating,
    lastSyncedAt,
    leaveRoom: () => runMutation(() => (roomId ? leaveOnlineRoom(roomId) : Promise.resolve())),
    refresh,
    removeMember: (memberId) =>
      runMutation(() => (roomId ? removeOnlineRoomMember(roomId, memberId) : Promise.resolve())),
    removeOwnSubmission: (submissionId) =>
      runMutation(() =>
        roomId ? removeOwnOnlineSubmission(roomId, submissionId) : Promise.resolve(),
      ),
    prepareNextRound: () =>
      runMutation(() => (roomId ? prepareNextOnlineRound(roomId) : Promise.resolve())),
    playAgain: () =>
      runMutation(() => (roomId ? playAgainOnlineRoom(roomId) : Promise.resolve())),
    scheduleMatchupPreview: (matchupId, submissionId) =>
      runMutation(() =>
        roomId ? scheduleOnlineMatchupPreview(roomId, matchupId, submissionId) : Promise.resolve(),
      ),
    selectMatchupWinner: (matchupId, winnerSubmissionId) =>
      runMutation(() =>
        roomId
          ? selectOnlineMatchupWinner(roomId, matchupId, winnerSubmissionId)
          : Promise.resolve(),
      ),
    snapshot,
    startRoom: () => runMutation(() => (roomId ? startOnlineRoom(roomId) : Promise.resolve())),
    submitSong: (song) =>
      runMutation(() => (roomId ? submitOnlineRoundSong(roomId, song) : Promise.resolve())),
    submitTopic: (topic) =>
      runMutation(() => (roomId ? submitOnlineRoundTopic(roomId, topic) : Promise.resolve())),
    updateSettings: (update) =>
      runMutation(() => (roomId ? updateOnlineRoomSettings(roomId, update) : Promise.resolve())),
  };
}
