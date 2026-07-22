import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActiveMatchupPanel } from "../../../src/components/game/ActiveMatchupPanel";
import { BracketProgress } from "../../../src/components/game/BracketProgress";
import { GameOverPanel } from "../../../src/components/game/GameOverPanel";
import { OnlineConnectionStatus } from "../../../src/components/game/OnlineConnectionStatus";
import {
  RemotePlaybackControls,
  RemotePlaybackPanel,
} from "../../../src/components/game/OnlineRemotePlayback";
import { OnlineTopicPanel } from "../../../src/components/game/OnlineTopicPanel";
import { RoundResultPanel } from "../../../src/components/game/RoundResultPanel";
import { Scoreboard } from "../../../src/components/game/Scoreboard";
import { SongActionCard } from "../../../src/components/game/SongActionCard";
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
  getOnlineSubmissionCountForMember,
  hasDuplicateOnlineSongSubmission,
} from "../../../src/services/online/onlineRoundSubmissions";
import {
  canJudgeOnlineMatchup,
  getActiveOnlineMatchup,
} from "../../../src/services/online/onlineRoundJudging";
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
  const [isResolvingSubmission, setIsResolvingSubmission] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const songSearch = useSongSearch({ limit: 8 });
  const previewAudio = usePreviewAudio();
  const snapshot = onlineRoom.snapshot;
  const currentRound = snapshot?.currentRound;
  const presenceSummary = snapshot ? getOnlinePresenceSummary(snapshot) : undefined;
  const currentMember = snapshot?.members.find((member) => member.userId === currentUserId);
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
    const notice = getOnlineRoomExitNotice(snapshot, onlineRoom.errorMessage);

    if (notice) {
      void clearLastOnlineRoomId();
      router.replace({
        pathname: "/",
        params: {
          notice,
        },
      });
    }
  }, [onlineRoom.errorMessage, snapshot?.room.status]);

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
    await songSearch.search();
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

      await previewAudio.stopSongPreview("Submitted");
      songSearch.clearResults();
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

    await previewAudio.stopSongPreview("Removed submission");
  }

  async function pickMatchupWinner(winnerSubmissionId: string) {
    if (!activeMatchup || !canJudgeMatchup || remotePlayback.isLocked) {
      return;
    }

    const didPickWinner = await onlineRoom.selectMatchupWinner(activeMatchup.id, winnerSubmissionId);

    if (!didPickWinner) {
      return;
    }

    await previewAudio.stopSongPreview("Winner picked");
  }

  async function scheduleSyncedPreview(entry: MatchupEntry | undefined) {
    if (!activeMatchup || !entry || !isJudge || snapshot?.room.mode !== "remote") {
      return;
    }

    await previewAudio.stopSongPreview("Scheduling synced preview");
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

    await previewAudio.stopSongPreview("No preview playing");
    await clearPreviewCache();
    songSearch.clearResults();
  }

  async function playAgain() {
    if (!isHost) {
      return;
    }

    const didPlayAgain = await onlineRoom.playAgain();

    if (!didPlayAgain) {
      return;
    }

    await previewAudio.stopSongPreview("No preview playing");
    await clearPreviewCache();
    songSearch.clearResults();
  }

  async function resetRoom() {
    if (!isHost) {
      return;
    }

    const didReset = await onlineRoom.closeRoom();

    if (!didReset) {
      return;
    }

    await previewAudio.stopSongPreview("No preview playing");
    await clearPreviewCache();
  }

  async function exitOnlineRoom() {
    if (!snapshot || onlineRoom.isMutating) {
      return;
    }

    const didExit = isHost ? await onlineRoom.closeRoom() : await onlineRoom.leaveRoom();

    if (!didExit) {
      return;
    }

    await previewAudio.stopSongPreview("No preview playing");
    await clearPreviewCache();

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
    void previewAudio.stopSongPreview("No preview playing");
    void clearPreviewCache();
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
            <Text style={styles.title}>{getRoundTitle(currentRound?.status)}</Text>
            <Text style={styles.body}>{getRoundSubtitle(currentRound?.status)}</Text>
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
                presenceLabel={presenceSummary?.label}
                presenceReady={Boolean(
                  presenceSummary && presenceSummary.onlineCount === presenceSummary.totalCount,
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
                <View style={styles.panel}>
                  <View style={styles.progressHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>Submission progress</Text>
                      <Text style={styles.progressText}>
                        {submissions.length}/{requiredSubmissionCount} songs submitted
                      </Text>
                    </View>
                    {onlineRoom.isMutating ? <ActivityIndicator color="#38BDF8" /> : null}
                  </View>

                  {contestantMembers.map((member) => (
                    <View key={member.id} style={styles.progressRow}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      <Text style={styles.progressCount}>
                        {getOnlineSubmissionCountForMember(submissions, member.id)}/{songsPerPlayer}
                      </Text>
                    </View>
                  ))}

                  {isJudge ? (
                    <Text style={styles.body}>
                      Waiting for contestants to finish submitting songs.
                    </Text>
                  ) : (
                    <View style={styles.submissionArea}>
                      <Text style={styles.body}>
                        You have {songsRemaining} song{songsRemaining === 1 ? "" : "s"} left.
                      </Text>

                      {ownSubmissions.length > 0 ? (
                        <View style={styles.submittedList}>
                          <Text style={styles.sectionTitle}>Your songs</Text>
                          {ownSubmissions.map((submission) => (
                            <View key={submission.id} style={styles.submittedRow}>
                              <View style={styles.submittedText}>
                                <Text style={styles.submittedTitle}>{submission.song.title}</Text>
                                <Text style={styles.submittedArtist}>
                                  {submission.song.artists.join(", ")}
                                </Text>
                              </View>
                              <Pressable
                                accessibilityLabel={`Remove ${submission.song.title}`}
                                accessibilityRole="button"
                                disabled={onlineRoom.isMutating}
                                style={[
                                  styles.smallButton,
                                  onlineRoom.isMutating ? styles.disabledButton : undefined,
                                ]}
                                onPress={() => void removeSubmission(submission.id)}
                              >
                                <Text style={styles.smallButtonText}>Remove</Text>
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {songsRemaining > 0 ? (
                        <>
                          <TextInput
                            accessibilityLabel="Search for a song"
                            autoCapitalize="words"
                            autoCorrect={false}
                            editable={!onlineRoom.isMutating && !songSearch.isSearching}
                            onChangeText={(nextQuery) => {
                              songSearch.setQuery(nextQuery);
                              onlineRoom.clearError();
                            }}
                            onSubmitEditing={() => void searchSongs()}
                            placeholder="Search song or artist"
                            placeholderTextColor="#64748B"
                            returnKeyType="search"
                            style={styles.input}
                            value={songSearch.query}
                          />
                          <Pressable
                            accessibilityLabel="Search songs"
                            accessibilityRole="button"
                            disabled={songSearch.isSearching}
                            style={[
                              styles.primaryButton,
                              songSearch.isSearching ? styles.disabledButton : undefined,
                            ]}
                            onPress={() => void searchSongs()}
                          >
                            {songSearch.isSearching ? (
                              <ActivityIndicator color="#082F49" />
                            ) : (
                              <Text style={styles.primaryButtonText}>Search</Text>
                            )}
                          </Pressable>
                          <Text style={styles.audioStatus}>{previewAudio.audioStatus}</Text>
                          {songSearch.errorMessage ? (
                            <Text style={styles.errorText}>{songSearch.errorMessage}</Text>
                          ) : null}
                          {songSearch.results.length > 0 ? (
                            <View style={styles.resultsList}>
                              {songSearch.results.map((song) => {
                                const isDuplicate = hasDuplicateOnlineSongSubmission(
                                  submissions,
                                  song,
                                );

                                return (
                                  <SongActionCard
                                    key={`${song.id}:${song.title}`}
                                    primaryDisabled={
                                      !canSubmitSong || isResolvingSubmission || isDuplicate
                                    }
                                    primaryLabel={
                                      isResolvingSubmission
                                        ? "Checking..."
                                        : isDuplicate
                                          ? "Already Picked"
                                          : "Submit"
                                    }
                                    secondaryDisabled={isResolvingSubmission}
                                    secondaryLabel="Play Preview"
                                    song={song}
                                    onPrimaryPress={() => void submitSong(song)}
                                    onSecondaryPress={() => void previewAudio.playSongPreview(song)}
                                  />
                                );
                              })}
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <Text style={styles.body}>Your songs are locked in.</Text>
                      )}
                    </View>
                  )}
                </View>
              ) : null}

              {currentRound?.status === "judging" ? (
                <View style={styles.panel}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.sectionTitle}>Judging bracket</Text>
                    {onlineRoom.isMutating ? <ActivityIndicator color="#38BDF8" /> : null}
                  </View>
                  {activeMatchup ? (
                    isJudge ? (
                      <>
                        <ActiveMatchupPanel
                          isPickingWinner={onlineRoom.isMutating || remotePlayback.isLocked}
                          matchup={activeMatchup}
                          showPreviewActions={snapshot.room.mode !== "remote"}
                          onPickWinner={(winnerSubmissionId) =>
                            void pickMatchupWinner(winnerSubmissionId)
                          }
                          onPlayPreview={(song) => void previewAudio.playSongPreview(song)}
                        />
                        {snapshot.room.mode === "remote" ? (
                          <RemotePlaybackControls
                            isDisabled={onlineRoom.isMutating || remotePlayback.isLocked}
                            left={activeMatchup.left}
                            right={activeMatchup.right}
                            onSchedule={(entry) => void scheduleSyncedPreview(entry)}
                          />
                        ) : null}
                        <Text style={styles.audioStatus}>{previewAudio.audioStatus}</Text>
                      </>
                    ) : (
                      <Text style={styles.body}>
                        Waiting for {judgeMember?.displayName ?? "the judge"} to pick a winner.
                      </Text>
                    )
                  ) : (
                    <Text style={styles.body}>Preparing the next matchup...</Text>
                  )}
                  {snapshot.room.mode === "remote" ? (
                    <RemotePlaybackPanel playback={remotePlayback} />
                  ) : null}
                  <BracketProgress activeMatchupId={activeMatchup?.id} matchups={matchups} />
                  <Scoreboard players={onlinePlayers} scores={playerScores} />
                </View>
              ) : null}

              {currentRound?.status === "complete" && snapshot.room.status !== "complete" ? (
                <View style={styles.panel}>
                  {roundWinnerMember && winningSubmission ? (
                    canPrepareNextRound ? (
                      <RoundResultPanel
                        winnerName={roundWinnerMember.displayName}
                        winningSongLabel={`Winning song: ${winningSubmission.song.title} by ${winningSubmission.song.artists.join(", ")}`}
                        onStartNextRound={() => void startNextRound()}
                      />
                    ) : (
                      <>
                        <Text style={styles.sectionTitle}>Round complete</Text>
                        <Text style={styles.judgeName}>{roundWinnerMember.displayName} wins</Text>
                        <Text style={styles.body}>
                          Waiting for the host or next judge to start the next round.
                        </Text>
                      </>
                    )
                  ) : (
                    <Text style={styles.body}>Round complete.</Text>
                  )}
                  <Scoreboard players={onlinePlayers} scores={playerScores} />
                </View>
              ) : null}

              {snapshot.room.status === "complete" ? (
                <View style={styles.panel}>
                  {isHost && gameWinnerMember ? (
                    <GameOverPanel
                      players={onlinePlayers}
                      pointsToWin={snapshot.room.pointsToWin}
                      scores={playerScores}
                      winnerName={gameWinnerMember.displayName}
                      onPlayAgain={() => void playAgain()}
                      onResetRoom={() => void resetRoom()}
                    />
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>Game complete</Text>
                      <Text style={styles.judgeName}>
                        {gameWinnerMember?.displayName ?? "Winner"} wins
                      </Text>
                      {winningSubmission ? (
                        <Text style={styles.body}>
                          Final song: {winningSubmission.song.title} by{" "}
                          {winningSubmission.song.artists.join(", ")}
                        </Text>
                      ) : null}
                      <Text style={styles.body}>
                        Waiting for the host to play again or reset the room.
                      </Text>
                      <Scoreboard players={onlinePlayers} scores={playerScores} />
                    </>
                  )}
                </View>
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

function getRoundTitle(status: string | undefined): string {
  if (status === "submitting") {
    return "Submissions";
  }

  if (status === "judging") {
    return "Judging next";
  }

  if (status === "complete") {
    return "Round complete";
  }

  return "Topic setup";
}

function getRoundSubtitle(status: string | undefined): string {
  if (status === "submitting") {
    return "Contestants pick songs for the locked topic.";
  }

  if (status === "judging") {
    return "The submission phase is complete.";
  }

  if (status === "complete") {
    return "Scores are updated and the next judge is set.";
  }

  return "The judge sets the prompt for this round.";
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
  panel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  judgeName: {
    color: "#F9FAFB",
    fontSize: 26,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  progressRow: {
    alignItems: "center",
    borderColor: "#334155",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  memberName: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
  progressCount: {
    color: "#7DD3FC",
    fontSize: 16,
    fontWeight: "900",
  },
  submissionArea: {
    gap: 10,
  },
  submittedList: {
    gap: 8,
  },
  submittedRow: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
  },
  submittedText: {
    flex: 1,
    gap: 2,
  },
  submittedTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
  },
  submittedArtist: {
    color: "#94A3B8",
    fontSize: 14,
  },
  smallButton: {
    alignItems: "center",
    borderColor: "#FCA5A5",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900",
  },
  audioStatus: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  resultsList: {
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
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
