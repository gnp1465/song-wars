import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { OnlineRoomSnapshot } from "../types/onlineRoom";
import {
  closeOnlineRoom,
  fetchOnlineRoomSnapshot,
  leaveOnlineRoom,
  prepareNextOnlineRound,
  removeOwnOnlineSubmission,
  removeOnlineRoomMember,
  selectOnlineMatchupWinner,
  startOnlineRoom,
  submitOnlineRoundSong,
  submitOnlineRoundTopic,
  subscribeToOnlineRoom,
  updateOnlineRoomSettings,
} from "../services/online/OnlineRoomService";
import type { OnlineRoomSettingsUpdate } from "../types/onlineRoom";
import type { MediaTrack } from "../types/media";

export interface UseOnlineRoomResult {
  errorMessage?: string;
  isLoading: boolean;
  isMutating: boolean;
  refresh: () => Promise<void>;
  snapshot?: OnlineRoomSnapshot;
  clearError: () => void;
  closeRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  removeOwnSubmission: (submissionId: string) => Promise<void>;
  selectMatchupWinner: (matchupId: string, winnerSubmissionId: string) => Promise<void>;
  startRoom: () => Promise<void>;
  submitSong: (song: MediaTrack) => Promise<void>;
  submitTopic: (topic: string) => Promise<void>;
  prepareNextRound: () => Promise<void>;
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
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!roomId || !currentUserId) {
      return;
    }

    setIsLoading(true);

    try {
      setSnapshot(await fetchOnlineRoomSnapshot(roomId));
      setErrorMessage(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load online room.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (!roomId || !snapshot) {
      return undefined;
    }

    const currentMember = snapshot.members.find((member) => member.userId === currentUserId);

    subscriptionRef.current = subscribeToOnlineRoom(
      roomId,
      currentMember?.id,
      () => {
        void refresh();
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
    errorMessage,
    isLoading,
    isMutating,
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
