import { Audio } from "expo-av";
import { useMemo, useRef, useState } from "react";
import {
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
import {
  generateBracket,
  generateNextRoundMatchups,
  selectMatchupWinner,
} from "../services/game/bracket";
import { AudioStatusBar } from "../components/game/AudioStatusBar";
import { SongActionCard } from "../components/game/SongActionCard";
import { completeRound, type PlayerScore } from "../services/game/scoring";
import { MediaResolutionService } from "../services/media/MediaResolutionService";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import type { BracketMatchup, Player, SongSubmission } from "../types/game";
import type { MediaTrack } from "../types/media";

const TOPICS = ["Beach vibes", "Road trip", "Late night", "Main character"];

const PLAYERS: Player[] = [
  { id: "player-1", displayName: "Gus", isHost: true, isGuest: false },
  { id: "player-2", displayName: "Maya", isHost: false, isGuest: true },
  { id: "player-3", displayName: "Jay", isHost: false, isGuest: true },
  { id: "player-4", displayName: "Nina", isHost: false, isGuest: true },
];

export function LocalBattleDemoScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingPreviewRef = useRef(false);
  const initialRoundId = "demo-round-1";
  const initialBracket = useMemo(() => createDemoBracket(initialRoundId, 42), []);
  const [roundIndex, setRoundIndex] = useState(1);
  const [topicInput, setTopicInput] = useState("Beach vibes");
  const [activeTopic, setActiveTopic] = useState<string | undefined>();
  const [songsPerPlayer, setSongsPerPlayer] = useState(1);
  const [submissionStepIndex, setSubmissionStepIndex] = useState(0);
  const [selectedSubmissions, setSelectedSubmissions] = useState<SongSubmission[]>([]);
  const [submissionQuery, setSubmissionQuery] = useState("Espresso Sabrina Carpenter");
  const [submissionSearchResults, setSubmissionSearchResults] = useState<MediaTrack[]>([]);
  const [isSearchingSubmissions, setIsSearchingSubmissions] = useState(false);
  const [judgePlayerId, setJudgePlayerId] = useState("player-1");
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [matchups, setMatchups] = useState<BracketMatchup[]>(initialBracket);
  const [roundWinnerPlayerId, setRoundWinnerPlayerId] = useState<string | undefined>();
  const [audioStatus, setAudioStatus] = useState("No preview playing");

  const currentRoundId = `demo-round-${roundIndex}`;
  const fallbackTopic = TOPICS[(roundIndex - 1) % TOPICS.length];
  const topic = activeTopic ?? fallbackTopic;
  const submittingPlayers = PLAYERS.filter((player) => player.id !== judgePlayerId);
  const currentSubmittingPlayer = submittingPlayers[submissionStepIndex];
  const hasFinishedSubmissions = selectedSubmissions.length === submittingPlayers.length * songsPerPlayer;
  const activeMatchup = matchups.find(
    (matchup) => matchup.roundNumber === activeRoundNumber && matchup.status === "ready",
  );
  const currentJudge = getPlayerName(judgePlayerId);

  async function pickWinner(winnerSubmissionId: string) {
    if (!activeMatchup) {
      return;
    }

    await stopSongPreview();

    const completedMatchup = selectMatchupWinner(activeMatchup, winnerSubmissionId);
    const updatedMatchups = matchups.map((matchup) =>
      matchup.id === completedMatchup.id ? completedMatchup : matchup,
    );
    const unfinishedInCurrentRound = updatedMatchups.some(
      (matchup) => matchup.roundNumber === activeRoundNumber && matchup.status === "ready",
    );

    if (unfinishedInCurrentRound) {
      setMatchups(updatedMatchups);
      return;
    }

    const currentRoundMatchups = updatedMatchups.filter(
      (matchup) => matchup.roundNumber === activeRoundNumber,
    );
    const nextRoundMatchups = generateNextRoundMatchups(currentRoundId, currentRoundMatchups);

    if (nextRoundMatchups.length > 0) {
      setMatchups([...updatedMatchups, ...nextRoundMatchups]);
      setActiveRoundNumber(nextRoundMatchups[0].roundNumber);
      return;
    }

    const roundResult = completeRound({
      players: PLAYERS,
      finalMatchup: completedMatchup,
      currentScores: scores,
    });

    setMatchups(updatedMatchups);
    setScores(roundResult.scores);
    setJudgePlayerId(roundResult.nextJudgePlayerId);
    setRoundWinnerPlayerId(roundResult.winningPlayerId);
  }

  async function playSongPreview(song: MediaTrack) {
    if (isLoadingPreviewRef.current) {
      return;
    }

    isLoadingPreviewRef.current = true;
    setAudioStatus(`Loading ${song.title}...`);

    try {
      await stopSongPreview();

      const service = new MediaResolutionService({
        providers: [new AppleITunesProvider()],
      });
      const result = await service.resolveTrackPreview({
        sourceTrack: song,
        storefrontCode: "US",
        preferredProviderIds: ["apple_itunes"],
      });

      if (!result.track.preview?.streamUrl) {
        throw new Error(result.reason ?? "No preview found.");
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: result.track.preview.streamUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setAudioStatus(`Playing ${result.track.title}`);
    } catch (error) {
      setAudioStatus(error instanceof Error ? error.message : "Preview playback failed.");
    } finally {
      isLoadingPreviewRef.current = false;
    }
  }

  async function stopSongPreview() {
    if (!soundRef.current) {
      return;
    }

    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
    soundRef.current = null;
    setAudioStatus("Stopped");
  }

  function resetDemo() {
    void stopSongPreview();
    setRoundIndex(1);
    setTopicInput("Beach vibes");
    setActiveTopic(undefined);
    setSongsPerPlayer(1);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setJudgePlayerId("player-1");
    setScores([]);
    setActiveRoundNumber(1);
    setMatchups(initialBracket);
    setRoundWinnerPlayerId(undefined);
  }

  function startNextRound() {
    void stopSongPreview();

    const nextRoundIndex = roundIndex + 1;
    const nextRoundId = `demo-round-${nextRoundIndex}`;
    const nextTopic = TOPICS[(nextRoundIndex - 1) % TOPICS.length];

    setRoundIndex(nextRoundIndex);
    setTopicInput(nextTopic);
    setActiveTopic(undefined);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setActiveRoundNumber(1);
    setMatchups([]);
    setRoundWinnerPlayerId(undefined);
    setAudioStatus("No preview playing");
  }

  async function selectSubmissionSong(song: MediaTrack) {
    const submittingPlayer = submittingPlayers[submissionStepIndex];

    if (!submittingPlayer) {
      return;
    }

    const isDuplicate = selectedSubmissions.some((submission) =>
      isSameSong(submission.song, song),
    );

    if (isDuplicate) {
      setAudioStatus("That song was already submitted. Pick a different one.");
      return;
    }

    await stopSongPreview();

    const submission = createSubmission(
      currentRoundId,
      `${currentRoundId}:sub-${selectedSubmissions.length + 1}`,
      submittingPlayer.id,
      song.title,
      song.artists.join(", ") || "Unknown Artist",
    );
    const nextSubmissions = [...selectedSubmissions, submission];

    setSelectedSubmissions(nextSubmissions);
    setSubmissionSearchResults([]);
    setSubmissionQuery("");

    const currentPlayerSubmissionCount = nextSubmissions.filter(
      (submissionItem) => submissionItem.playerId === submittingPlayer.id,
    ).length;

    if (currentPlayerSubmissionCount >= songsPerPlayer) {
      setSubmissionStepIndex((currentIndex) => currentIndex + 1);
    }

    if (nextSubmissions.length === submittingPlayers.length * songsPerPlayer) {
      setMatchups(generateBracket({ roundId: currentRoundId, submissions: nextSubmissions, seed: 42 + roundIndex }));
      setActiveRoundNumber(1);
    }
  }

  async function searchSubmissionSongs() {
    Keyboard.dismiss();
    setIsSearchingSubmissions(true);
    setAudioStatus("Searching songs...");

    try {
      const provider = new AppleITunesProvider();
      const results = await provider.searchTracks({
        query: submissionQuery,
        storefrontCode: "US",
        limit: 8,
      });

      setSubmissionSearchResults(results.map((result) => result.track));
      setAudioStatus("Search ready");
    } catch (error) {
      setAudioStatus(error instanceof Error ? error.message : "Song search failed.");
    } finally {
      setIsSearchingSubmissions(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <AudioStatusBar status={audioStatus} onStop={() => void stopSongPreview()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
        style={styles.keyboardArea}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!activeTopic ? (
          <View style={styles.setupPanel}>
            <Text style={styles.eyebrow}>Judge Setup</Text>
            <Text style={styles.title}>Choose the topic</Text>
            <Text style={styles.body}>Judge: {currentJudge}</Text>
            <View style={styles.settingsPanel}>
              <Text style={styles.sectionTitle}>Room settings</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Songs per player</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setSongsPerPlayer((value) => Math.max(1, value - 1))}
                  >
                    <Text style={styles.stepperText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{songsPerPlayer}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setSongsPerPlayer((value) => Math.min(3, value + 1))}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setTopicInput}
              placeholder="Round topic"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={topicInput}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={() => setActiveTopic(topicInput.trim() || fallbackTopic)}
            >
              <Text style={styles.primaryButtonText}>Start Battle</Text>
            </Pressable>
          </View>
        ) : null}

        {activeTopic && !hasFinishedSubmissions ? (
          <View style={styles.setupPanel}>
            <Text style={styles.eyebrow}>Submissions</Text>
            <Text style={styles.title}>Pick a song</Text>
            <Text style={styles.body}>Topic: {topic}</Text>
            <Text style={styles.body}>Songs per player: {songsPerPlayer}</Text>
            <Text style={styles.body}>
              Player: {currentSubmittingPlayer?.displayName ?? "All players submitted"}
            </Text>
            <View style={styles.progressPanel}>
              {submittingPlayers.map((player) => {
                const hasSubmitted = selectedSubmissions.some(
                  (submission) => submission.playerId === player.id,
                );

                return (
                  <View key={player.id} style={styles.progressRow}>
                    <Text style={styles.progressName}>{player.displayName}</Text>
                    <Text style={hasSubmitted ? styles.progressDone : styles.progressPending}>
                      {hasSubmitted ? "Submitted" : "Waiting"}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setSubmissionQuery}
                placeholder="Search songs"
                placeholderTextColor="#64748B"
                returnKeyType="search"
                onSubmitEditing={() => void searchSubmissionSongs()}
                style={styles.input}
                value={submissionQuery}
              />
              <Pressable style={styles.searchButton} onPress={() => void searchSubmissionSongs()}>
                <Text style={styles.searchButtonText}>
                  {isSearchingSubmissions ? "..." : "Search"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.submissionChoices}>
              {submissionSearchResults.map((song) => (
                <SongActionCard
                  key={song.id}
                  song={song}
                  primaryLabel="Submit"
                  secondaryLabel="Play Preview"
                  onPrimaryPress={() => void selectSubmissionSong(song)}
                  onSecondaryPress={() => void playSongPreview(song)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {activeTopic && hasFinishedSubmissions ? (
          <>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Local Battle Demo</Text>
          <Text style={styles.title}>Song Wars</Text>
          <Text style={styles.body}>Topic: {topic}</Text>
          <Text style={styles.body}>Judge: {currentJudge}</Text>
        </View>

        {activeMatchup ? (
          <View style={styles.matchup}>
            <Text style={styles.roundLabel}>Round {activeMatchup.roundNumber}</Text>
            <SongChoice
              entry={activeMatchup.left}
              onPick={(submissionId) => void pickWinner(submissionId)}
              onPlayPreview={playSongPreview}
            />
            <Text style={styles.vs}>vs</Text>
            <SongChoice
              entry={activeMatchup.right}
              onPick={(submissionId) => void pickWinner(submissionId)}
              onPlayPreview={playSongPreview}
            />
          </View>
        ) : (
          <View style={styles.matchup}>
            <Text style={styles.roundLabel}>Round complete</Text>
            <Text style={styles.winner}>
              Winner: {roundWinnerPlayerId ? getPlayerName(roundWinnerPlayerId) : "Pending"}
            </Text>
            <Text style={styles.body}>
              Winning song: {getWinningSongLabel(roundWinnerPlayerId, selectedSubmissions)}
            </Text>
            <Pressable style={styles.primaryButton} onPress={startNextRound}>
              <Text style={styles.primaryButtonText}>Start Next Round</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.scoreboard}>
          <Text style={styles.sectionTitle}>Scoreboard</Text>
          {PLAYERS.map((player) => (
            <View key={player.id} style={styles.scoreRow}>
              <Text style={styles.scoreName}>{player.displayName}</Text>
              <Text style={styles.scoreValue}>{getScore(player.id, scores)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.scoreboard}>
          <Text style={styles.sectionTitle}>Bracket</Text>
          {matchups.map((matchup) => (
            <View key={matchup.id} style={styles.bracketRow}>
              <Text style={styles.bracketRound}>R{matchup.roundNumber}</Text>
              <Text numberOfLines={1} style={styles.bracketSongs}>
                {getMatchupLabel(matchup)}
              </Text>
              <Text style={styles.bracketStatus}>{formatMatchupStatus(matchup)}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.resetButton} onPress={resetDemo}>
          <Text style={styles.resetButtonText}>Reset Demo</Text>
        </Pressable>
          </>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface SongChoiceProps {
  entry: BracketMatchup["left"];
  onPick: (submissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
}

function SongChoice({ entry, onPick, onPlayPreview }: SongChoiceProps) {
  return (
    <SongActionCard
      song={entry?.song}
      primaryLabel="Pick Winner"
      secondaryLabel={entry ? "Play Preview" : undefined}
      onPrimaryPress={entry ? () => onPick(entry.submissionId) : undefined}
      onSecondaryPress={entry ? () => onPlayPreview(entry.song) : undefined}
    />
  );
}

function getScore(playerId: string, scores: PlayerScore[]): number {
  return scores.find((score) => score.playerId === playerId)?.points ?? 0;
}

function getPlayerName(playerId: string): string {
  return PLAYERS.find((player) => player.id === playerId)?.displayName ?? "Unknown";
}

function getWinningSongLabel(
  winningPlayerId: string | undefined,
  submissions: SongSubmission[],
): string {
  const winningSubmission = submissions.find(
    (submission) => submission.playerId === winningPlayerId,
  );

  if (!winningSubmission) {
    return "Pending";
  }

  return `${winningSubmission.song.title} by ${winningSubmission.song.artists.join(", ")}`;
}

function getMatchupLabel(matchup: BracketMatchup): string {
  const leftTitle = matchup.left?.song.title ?? "Bye";
  const rightTitle = matchup.right?.song.title ?? "Bye";

  return `${leftTitle} vs ${rightTitle}`;
}

function formatMatchupStatus(matchup: BracketMatchup): string {
  if (matchup.status !== "complete") {
    return matchup.status === "ready" ? "Ready" : "Pending";
  }

  const winner = [matchup.left, matchup.right].find(
    (entry) => entry?.submissionId === matchup.winnerSubmissionId,
  );

  return `Won: ${winner?.song.title ?? "Winner"}`;
}

function createSubmission(
  roundId: string,
  id: string,
  playerId: string,
  title: string,
  artist: string,
): SongSubmission {
  return {
    id,
    playerId,
    roundId,
    song: createTrack(title, artist),
    submittedAtMs: Date.now(),
  };
}

function createDemoBracket(roundId: string, seed: number): BracketMatchup[] {
  const submissions = PLAYERS.map((player, index) => {
    const song = DEMO_SONG_POOL[index % DEMO_SONG_POOL.length];

    return createSubmission(
      roundId,
      `${roundId}:sub-${index + 1}`,
      player.id,
      song.title,
      song.artists.join(", ") || "Unknown Artist",
    );
  });

  return generateBracket({ roundId, submissions, seed });
}

function createTrack(title: string, artist: string): MediaTrack {
  return {
    id: `demo:${title}`,
    title,
    artists: [artist],
    providerRefs: [],
    capabilities: ["metadata_only"],
    resolutionStatus: "unresolved",
    attribution: [],
  };
}

function isSameSong(firstSong: MediaTrack, secondSong: MediaTrack): boolean {
  return normalizeSongKey(firstSong) === normalizeSongKey(secondSong);
}

function normalizeSongKey(song: MediaTrack): string {
  return `${song.title}:${song.artists.join(",")}`.toLowerCase().trim();
}

const DEMO_SONG_POOL: MediaTrack[] = [
  createTrack("Espresso", "Sabrina Carpenter"),
  createTrack("Blinding Lights", "The Weeknd"),
  createTrack("Golden", "Harry Styles"),
  createTrack("Levitating", "Dua Lipa"),
  createTrack("Good Days", "SZA"),
  createTrack("As It Was", "Harry Styles"),
];

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    gap: 8,
  },
  setupPanel: {
    gap: 14,
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
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 86,
  },
  searchButtonText: {
    color: "#082F49",
    fontSize: 15,
    fontWeight: "800",
  },
  settingsPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingLabel: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  stepperButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepperText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  stepperValue: {
    color: "#38BDF8",
    fontSize: 18,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
  matchup: {
    gap: 12,
  },
  roundLabel: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  pickHint: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  submissionChoices: {
    gap: 12,
  },
  progressPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 32,
  },
  progressName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },
  progressDone: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
  },
  progressPending: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },
  vs: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  winner: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "900",
  },
  scoreboard: {
    gap: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scoreRow: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
  },
  scoreName: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  scoreValue: {
    color: "#38BDF8",
    fontSize: 18,
    fontWeight: "900",
  },
  bracketRow: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
  },
  bracketRound: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "900",
    width: 28,
  },
  bracketSongs: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  bracketStatus: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 110,
  },
  resetButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  resetButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
});
