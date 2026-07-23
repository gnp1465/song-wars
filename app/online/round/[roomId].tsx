import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { OnlineConnectionStatus } from "../../../src/components/game/OnlineConnectionStatus";
import { OnlineJudgingPanel } from "../../../src/components/game/OnlineJudgingPanel";
import {
  OnlineGameCompletePanel,
  OnlineRoundCompletePanel,
} from "../../../src/components/game/OnlineOutcomePanels";
import { OnlineSubmissionPanel } from "../../../src/components/game/OnlineSubmissionPanel";
import { OnlineTopicPanel } from "../../../src/components/game/OnlineTopicPanel";
import { useOnlineRoom } from "../../../src/hooks/useOnlineRoom";
import { usePreviewAudio } from "../../../src/hooks/usePreviewAudio";
import { useRemotePreviewPlayback } from "../../../src/hooks/useRemotePreviewPlayback";
import { useSongSearch } from "../../../src/hooks/useSongSearch";
import { clearPreviewCache, precachePreview } from "../../../src/services/audio/previewCache";
import { getMatchupPreviewCacheTargets } from "../../../src/services/audio/previewPreloadQueue";
import { resolvePlayablePreviewTrack } from "../../../src/services/media/previewResolution";
import { getDeviceStorefrontCode } from "../../../src/services/media/storefront";
import { restoreOrCreateAnonymousSession } from "../../../src/services/online/AuthSessionService";
import { getOnlineRoomExitNotice } from "../../../src/services/online/onlineRoomAccess";
import { getOnlinePresenceSummary } from "../../../src/services/online/onlineRoomPresence";
import { clearLastOnlineRoomId } from "../../../src/services/online/onlineRoomResumeStorage";
import {
  canSubmitOnlineSong,
  getOnlineSongsRemaining,
  hasDuplicateOnlineSongSubmission,
} from "../../../src/services/online/onlineRoundSubmissions";
import {
  canJudgeOnlineMatchup,
  getActiveOnlineMatchup,
} from "../../../src/services/online/onlineRoundJudging";
import {
  getOnlineRoundSubtitle,
  getOnlineRoundTitle,
} from "../../../src/services/online/onlineRoundDisplay";
import {
  getOnlineRoundCleanupPlan,
  type OnlineRoundCleanupAction,
} from "../../../src/services/online/onlineRoundCleanup";
import {
  getLatestOnlinePlaybackEvent,
  isOnlinePlaybackEventActive,
} from "../../../src/services/online/onlinePlaybackEvents";
import {
  canSubmitOnlineTopic,
  normalizeOnlineTopic,
} from "../../../src/services/online/onlineRoundTopic";
import type { MediaTrack } from "../../../src/types/media";
import type { MatchupEntry, Player } from "../../../src/types/game";
import type { PlayerScore } from "../../../src/services/game/scoring";

export default function OnlineRoundSetupScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [hasSearchedSongs, setHasSearchedSongs] = useState(false);
  const [isResolvingSubmission, setIsResolvingSubmission] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const songSearch = useSongSearch({ limit: 8 });
  const previewAudio = usePreviewAudio();
  const snapshot = onlineRoom.snapshot;
  const currentRound = snapshot?.currentRound;
  const presenceSummary = snapshot ? getOnlinePresenceSummary(snapshot) : undefined;
  const currentMember = snapshot?.members.find((member) => member.userId === currentUserId);
  const exitNotice = getOnlineRoomExitNotice(snapshot, onlineRoom.errorMessage, currentUserId);
  const judgeMember = snapshot?.members.find((member) => member.id === currentRound?.judgeMemberId);
  const isJudge = Boolean(currentMember && judgeMember && currentMember.id === judgeMember.id);
  const isHost = Boolean(snapshot && currentUserId === snapshot.room.hostUserId);
  const submissions = snapshot?.submissions ?? [];
  const matchups = snapshot?.matchups ?? [];
  const scores = snapshot?.scores ?? [];
  const songsPerPlayer = snapshot?.room.songsPerPlayer ?? 1;
  const contestantMembers =
    snapshot?.members.filter((member) => member.id !== currentRound?.judgeMemberId) ?? [];
  const ownSubmissions = submissions.filter((submission) => submission.memberId === currentMember?.id);
  const requiredSubmissionCount = contestantMembers.length * songsPerPlayer;
  const activeMatchup = getActiveOnlineMatchup(matchups);
  const latestPlaybackEvent = getLatestOnlinePlaybackEvent(snapshot?.playbackEvents ?? []);
  const activePlaybackEvent = isOnlinePlaybackEventActive(latestPlaybackEvent)
    ? latestPlaybackEvent
    : undefined;
  const remotePlayback = useRemotePreviewPlayback(
    activePlaybackEvent,
    snapshot?.room.mode === "remote" && currentRound?.status === "judging",
  );
  const onlinePlayers: Player[] =
    snapshot?.members.map((member) => ({
      displayName: member.displayName,
      id: member.id,
      isGuest: member.role === "guest",
      isHost: member.role === "host",
    })) ?? [];
  const playerScores: PlayerScore[] = scores.map((score) => ({
    playerId: score.memberId,
    points: score.points,
  }));
  const roundWinnerMember = snapshot?.members.find(
    (member) => member.id === currentRound?.winningMemberId,
  );
  const winningSubmission = submissions.find(
    (submission) => submission.id === currentRound?.winningSubmissionId,
  );
  const gameWinnerMember = snapshot?.members.find(
    (member) => member.id === snapshot.room.gameWinnerMemberId,
  );
  const canPrepareNextRound = Boolean(
    currentMember &&
      currentRound?.winningMemberId &&
      (currentMember.id === currentRound.winningMemberId ||
        currentUserId === snapshot?.room.hostUserId),
  );
  const songsRemaining = getOnlineSongsRemaining({
    currentMember,
    songsPerPlayer,
    submissions,
  });
  const canSubmitTopic = canSubmitOnlineTopic({
    currentMemberId: currentMember?.id,
    isMutating: onlineRoom.isMutating,
    judgeMemberId: judgeMember?.id,
    roundStatus: currentRound?.status,
    topicInput,
  });
  const canSubmitSong = canSubmitOnlineSong({
    currentMember,
    currentRound,
    isMutating: onlineRoom.isMutating || isResolvingSubmission,
    songsPerPlayer,
    submissions,
  });
  const canJudgeMatchup = canJudgeOnlineMatchup({
    currentMember,
    currentRound,
    isMutating: onlineRoom.isMutating,
    matchups,
  });
  const normalizedTopic = normalizeOnlineTopic(topicInput);

  useEffect(() => {
    void restoreOrCreateAnonymousSession().then((session) => setCurrentUserId(session.userId));
  }, []);

  useEffect(() => {
    if (exitNotice) {
      void (async () => {
        await runRoundCleanup("forced_room_exit");
        await clearLastOnlineRoomId();
        router.replace({
          pathname: "/",
          params: {
            notice: exitNotice,
          },
        });
      })();
    }
  }, [exitNotice]);

  useEffect(() => {
    if (currentRound?.status !== "submitting") {
      void previewAudio.stopSongPreview("No preview playing");
    }
  }, [currentRound?.status]);

  useEffect(() => {
    return () => {
      void clearPreviewCache();
    };
  }, []);

  useEffect(() => {
    if (snapshot?.room.mode !== "remote" || currentRound?.status !== "judging" || !activeMatchup) {
      return;
    }

    let isCancelled = false;
    const preloadTargets = getMatchupPreviewCacheTargets([activeMatchup.left, activeMatchup.right]);

    void Promise.all(preloadTargets.map((target) => precachePreview(target))).catch(() => {
      if (!isCancelled) {
        previewAudio.setAudioStatus("Synced preview will load when played.");
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeMatchup?.id, currentRound?.status, snapshot?.room.mode]);

  async function submitTopic() {
    if (!canSubmitTopic) {
      return;
    }

    Keyboard.dismiss();
    await onlineRoom.submitTopic(normalizedTopic);
  }

  async function searchSongs() {
    Keyboard.dismiss();
    const result = await songSearch.search();

    if (result.ok) {
      setHasSearchedSongs(true);
    }
  }

  async function runRoundCleanup(action: OnlineRoundCleanupAction) {
    const cleanupPlan = getOnlineRoundCleanupPlan(action);

    await previewAudio.stopSongPreview(cleanupPlan.audioStatus);

    if (cleanupPlan.clearPreviewCache) {
      await clearPreviewCache();
    }

    if (cleanupPlan.clearSearchResults) {
      songSearch.clearResults();
      setHasSearchedSongs(false);
    }
  }

  async function submitSong(song: MediaTrack) {
    if (
      !canSubmitSong ||
      isResolvingSubmission ||
      hasDuplicateOnlineSongSubmission(submissions, song)
    ) {
      return;
    }

    Keyboard.dismiss();
    setIsResolvingSubmission(true);

    try {
      previewAudio.setAudioStatus(`Checking preview for ${song.title}...`);
      const resolvedSong = await resolvePlayablePreviewTrack(
        song,
        song.storefrontCode ?? getDeviceStorefrontCode(),
      );

      const didSubmit = await onlineRoom.submitSong(resolvedSong);

      if (!didSubmit) {
        return;
      }

      await runRoundCleanup("submission_submitted");
    } catch (error) {
      previewAudio.setAudioStatus(
        error instanceof Error ? error.message : "No playable preview found for this song.",
      );
    } finally {
      setIsResolvingSubmission(false);
    }
  }

  async function removeSubmission(submissionId: string) {
    const didRemove = await onlineRoom.removeOwnSubmission(submissionId);

    if (!didRemove) {
      return;
    }

    await runRoundCleanup("submission_removed");
  }

  async function pickMatchupWinner(winnerSubmissionId: string) {
    if (!activeMatchup || !canJudgeMatchup || remotePlayback.isLocked) {
      return;
    }

    const didPickWinner = await onlineRoom.selectMatchupWinner(activeMatchup.id, winnerSubmissionId);

    if (!didPickWinner) {
      return;
    }

    await runRoundCleanup("matchup_winner_picked");
  }

  async function scheduleSyncedPreview(entry: MatchupEntry | undefined) {
    if (!activeMatchup || !entry || !isJudge || snapshot?.room.mode !== "remote") {
      return;
    }

    await runRoundCleanup("synced_preview_scheduled");
    await onlineRoom.scheduleMatchupPreview(activeMatchup.id, entry.submissionId);
  }

  async function startNextRound() {
    if (!canPrepareNextRound) {
      return;
    }

    const didPrepare = await onlineRoom.prepareNextRound();

    if (!didPrepare) {
      return;
    }

    await runRoundCleanup("next_round_started");
  }

  async function playAgain() {
    if (!isHost) {
      return;
    }

    const didPlayAgain = await onlineRoom.playAgain();

    if (!didPlayAgain) {
      return;
    }

    await runRoundCleanup("game_restarted");
  }

  async function resetRoom() {
    if (!isHost) {
      return;
    }

    const didReset = await onlineRoom.closeRoom();

    if (!didReset) {
      return;
    }

    await runRoundCleanup("room_closed");
  }

  async function exitOnlineRoom() {
    if (!snapshot || onlineRoom.isMutating) {
      return;
    }

    const didExit = isHost ? await onlineRoom.closeRoom() : await onlineRoom.leaveRoom();

    if (!didExit) {
      return;
    }

    await runRoundCleanup(isHost ? "room_closed" : "room_left");

    await clearLastOnlineRoomId();
    router.replace("/");
  }

  function confirmExitOnlineRoom() {
    if (!snapshot || onlineRoom.isMutating) {
      return;
    }

    Alert.alert(
      isHost ? "Close online room?" : "Leave online room?",
      isHost
        ? "This closes the room for everyone and returns players Home."
        : "You will leave this room and return Home.",
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          onPress: () => void exitOnlineRoom(),
          style: isHost ? "destructive" : "default",
          text: isHost ? "Close Room" : "Leave Room",
        },
      ],
    );
  }

  function goHome() {
    void runRoundCleanup("home_navigation");
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Round {currentRound?.roundNumber ?? 1}</Text>
            <Text style={styles.title}>{getOnlineRoundTitle(currentRound?.status)}</Text>
            <Text style={styles.body}>{getOnlineRoundSubtitle(currentRound?.status)}</Text>
          </View>

          {onlineRoom.errorMessage && onlineRoom.connectionStatus !== "error" ? (
            <Text style={styles.errorText}>{onlineRoom.errorMessage}</Text>
          ) : null}

          {snapshot ? (
            <>
              <OnlineConnectionStatus
                errorMessage={onlineRoom.errorMessage}
                lastSyncedAt={onlineRoom.lastSyncedAt}
                onRetry={() => void onlineRoom.refresh()}
                status={onlineRoom.connectionStatus}
              />

              <OnlineTopicPanel
                canSubmitTopic={canSubmitTopic}
                isJudge={isJudge}
                isMutating={onlineRoom.isMutating}
                judgeName={judgeMember?.displayName ?? "the judge"}
                normalizedTopicLength={normalizedTopic.length}
                presenceLabel={
                  onlineRoom.presenceHasSynced
                    ? presenceSummary?.label
                    : snapshot
                      ? `${snapshot.members.length} players joined`
                      : undefined
                }
                presenceReady={Boolean(
                  onlineRoom.presenceHasSynced &&
                    presenceSummary &&
                    presenceSummary.onlineCount === presenceSummary.totalCount,
                )}
                roundStatus={currentRound?.status}
                topic={currentRound?.topic}
                topicInput={topicInput}
                onChangeTopic={(nextTopic) => {
                  setTopicInput(nextTopic);
                  onlineRoom.clearError();
                }}
                onSubmitTopic={submitTopic}
              />

              {currentRound?.status === "submitting" ? (
                <OnlineSubmissionPanel
                  audioStatus={previewAudio.audioStatus}
                  canSubmitSong={canSubmitSong}
                  contestantMembers={contestantMembers}
                  hasSearched={hasSearchedSongs}
                  isJudge={isJudge}
                  isMutating={onlineRoom.isMutating}
                  isResolvingSubmission={isResolvingSubmission}
                  isSearching={songSearch.isSearching}
                  ownSubmissions={ownSubmissions}
                  query={songSearch.query}
                  requiredSubmissionCount={requiredSubmissionCount}
                  results={songSearch.results}
                  searchErrorMessage={songSearch.errorMessage}
                  songsPerPlayer={songsPerPlayer}
                  songsRemaining={songsRemaining}
                  submissions={submissions}
                  onChangeQuery={(nextQuery) => {
                    setHasSearchedSongs(false);
                    songSearch.setQuery(nextQuery);
                  }}
                  onClearError={onlineRoom.clearError}
                  onPlayPreview={(song) => void previewAudio.playSongPreview(song)}
                  onRemoveSubmission={(submissionId) => void removeSubmission(submissionId)}
                  onSearch={() => void searchSongs()}
                  onSubmitSong={(song) => void submitSong(song)}
                />
              ) : null}

              {currentRound?.status === "judging" ? (
                <OnlineJudgingPanel
                  activeMatchup={activeMatchup}
                  audioStatus={previewAudio.audioStatus}
                  isJudge={isJudge}
                  isMutating={onlineRoom.isMutating}
                  isRemoteMode={snapshot.room.mode === "remote"}
                  judgeName={judgeMember?.displayName ?? "the judge"}
                  matchups={matchups}
                  players={onlinePlayers}
                  remotePlayback={remotePlayback}
                  scores={playerScores}
                  onPickWinner={(winnerSubmissionId) => void pickMatchupWinner(winnerSubmissionId)}
                  onPlayPreview={(song) => void previewAudio.playSongPreview(song)}
                  onScheduleSyncedPreview={(entry) => void scheduleSyncedPreview(entry)}
                />
              ) : null}

              {currentRound?.status === "complete" && snapshot.room.status !== "complete" ? (
                <OnlineRoundCompletePanel
                  canPrepareNextRound={canPrepareNextRound}
                  players={onlinePlayers}
                  scores={playerScores}
                  winningSong={winningSubmission?.song}
                  winnerName={roundWinnerMember?.displayName}
                  onStartNextRound={() => void startNextRound()}
                />
              ) : null}

              {snapshot.room.status === "complete" ? (
                <OnlineGameCompletePanel
                  gameWinnerName={gameWinnerMember?.displayName}
                  isHost={isHost}
                  players={onlinePlayers}
                  pointsToWin={snapshot.room.pointsToWin}
                  scores={playerScores}
                  winningSong={winningSubmission?.song}
                  onPlayAgain={() => void playAgain()}
                  onResetRoom={() => void resetRoom()}
                />
              ) : null}
            </>
          ) : (
            <Text style={styles.body}>Loading round setup...</Text>
          )}

          {snapshot ? (
            <Pressable
              accessibilityLabel={isHost ? "Close online room" : "Leave online room"}
              accessibilityRole="button"
              accessibilityState={{ disabled: onlineRoom.isMutating }}
              disabled={onlineRoom.isMutating}
              style={[
                styles.dangerButton,
                onlineRoom.isMutating ? styles.disabledButton : undefined,
              ]}
              onPress={confirmExitOnlineRoom}
            >
              <Text style={styles.dangerButtonText}>{isHost ? "Close Room" : "Leave Room"}</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityLabel="Back to home"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
  dangerButton: {
    alignItems: "center",
    borderColor: "#FCA5A5",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  dangerButtonText: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.45,
  },
});
