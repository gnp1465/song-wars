import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import {
  generateBracket,
  generateNextRoundMatchups,
  selectMatchupWinner,
} from "../services/game/bracket";
import { ActiveMatchupPanel } from "../components/game/ActiveMatchupPanel";
import { AudioStatusBar } from "../components/game/AudioStatusBar";
import { BattleStatusHeader } from "../components/game/BattleStatusHeader";
import { BracketProgress } from "../components/game/BracketProgress";
import { GameOverPanel } from "../components/game/GameOverPanel";
import { JudgeSetupPanel } from "../components/game/JudgeSetupPanel";
import { RoundResultPanel } from "../components/game/RoundResultPanel";
import { Scoreboard } from "../components/game/Scoreboard";
import { SubmissionSearchPanel } from "../components/game/SubmissionSearchPanel";
import { completeRound, getGameWinner, type PlayerScore } from "../services/game/scoring";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import { DEMO_PLAYERS, DEMO_SONG_POOL, DEMO_TOPICS, createDemoTrack } from "../data/demoGame";
import { usePreviewAudio } from "../hooks/usePreviewAudio";
import { useSongSearch } from "../hooks/useSongSearch";
import type { BracketMatchup, Player, RoomMode, SongSubmission } from "../types/game";
import type { MediaTrack } from "../types/media";

export interface LocalBattleDemoScreenProps {
  initialRoomMode?: RoomMode;
  initialSongsPerPlayer?: number;
  onResetRoom?: () => void;
  players?: Player[];
  pointsToWin?: number;
}

export function LocalBattleDemoScreen({
  initialRoomMode = "single_speaker",
  initialSongsPerPlayer = 1,
  onResetRoom,
  players = DEMO_PLAYERS,
  pointsToWin = 3,
}: LocalBattleDemoScreenProps) {
  const { audioStatus, playSongPreview, setAudioStatus, stopSongPreview } = usePreviewAudio();
  const initialRoundId = "demo-round-1";
  const roomPlayers = players.length >= 2 ? players : DEMO_PLAYERS;
  const initialJudgePlayerId = roomPlayers[0].id;
  const initialBracket = useMemo(
    () => createDemoBracket(initialRoundId, 42, roomPlayers),
    [roomPlayers],
  );
  const [roundIndex, setRoundIndex] = useState(1);
  const [topicInput, setTopicInput] = useState("Beach vibes");
  const [activeTopic, setActiveTopic] = useState<string | undefined>();
  const [roomMode] = useState(initialRoomMode);
  const [songsPerPlayer] = useState(initialSongsPerPlayer);
  const [submissionStepIndex, setSubmissionStepIndex] = useState(0);
  const [selectedSubmissions, setSelectedSubmissions] = useState<SongSubmission[]>([]);
  const [hasSearchedSubmissions, setHasSearchedSubmissions] = useState(false);
  const submissionSearch = useSongSearch({ initialQuery: "Espresso Sabrina Carpenter" });
  const [judgePlayerId, setJudgePlayerId] = useState(initialJudgePlayerId);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [matchups, setMatchups] = useState<BracketMatchup[]>(initialBracket);
  const [roundWinnerPlayerId, setRoundWinnerPlayerId] = useState<string | undefined>();
  const [gameWinnerPlayerId, setGameWinnerPlayerId] = useState<string | undefined>();

  const currentRoundId = `demo-round-${roundIndex}`;
  const fallbackTopic = DEMO_TOPICS[(roundIndex - 1) % DEMO_TOPICS.length];
  const topic = activeTopic ?? fallbackTopic;
  const submittingPlayers = roomPlayers.filter((player) => player.id !== judgePlayerId);
  const currentSubmittingPlayer = submittingPlayers[submissionStepIndex];
  const hasFinishedSubmissions = selectedSubmissions.length === submittingPlayers.length * songsPerPlayer;
  const activeMatchup = matchups.find(
    (matchup) => matchup.roundNumber === activeRoundNumber && matchup.status === "ready",
  );
  const currentJudge = getPlayerName(judgePlayerId, roomPlayers);

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
      players: roomPlayers,
      finalMatchup: completedMatchup,
      currentScores: scores,
    });
    const gameWinner = getGameWinner(roundResult.scores, pointsToWin);

    setMatchups(updatedMatchups);
    setScores(roundResult.scores);
    setJudgePlayerId(roundResult.nextJudgePlayerId);
    setRoundWinnerPlayerId(roundResult.winningPlayerId);
    setGameWinnerPlayerId(gameWinner?.playerId);
  }

  function resetDemo() {
    void stopSongPreview();
    setRoundIndex(1);
    setTopicInput("Beach vibes");
    setActiveTopic(undefined);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setHasSearchedSubmissions(false);
    setJudgePlayerId(initialJudgePlayerId);
    setScores([]);
    setActiveRoundNumber(1);
    setMatchups(initialBracket);
    setRoundWinnerPlayerId(undefined);
    setGameWinnerPlayerId(undefined);
    setAudioStatus("No preview playing");
  }

  function resetRoom() {
    void stopSongPreview();
    onResetRoom?.();
  }

  function startNextRound() {
    void stopSongPreview();

    const nextRoundIndex = roundIndex + 1;
    const nextRoundId = `demo-round-${nextRoundIndex}`;
    const nextTopic = DEMO_TOPICS[(nextRoundIndex - 1) % DEMO_TOPICS.length];

    setRoundIndex(nextRoundIndex);
    setTopicInput(nextTopic);
    setActiveTopic(undefined);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setHasSearchedSubmissions(false);
    setActiveRoundNumber(1);
    setMatchups([]);
    setRoundWinnerPlayerId(undefined);
    setGameWinnerPlayerId(undefined);
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
    submissionSearch.clearResults();
    submissionSearch.setQuery("");
    setHasSearchedSubmissions(false);

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
    setHasSearchedSubmissions(true);
    setAudioStatus("Searching songs...");
    const result = await submissionSearch.search();

    if (!result.ok) {
      setAudioStatus(result.errorMessage ?? "Song search failed.");
    } else {
      setAudioStatus("Search ready");
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
          <JudgeSetupPanel
            judgeName={currentJudge}
            pointsToWin={pointsToWin}
            roomMode={roomMode}
            songsPerPlayer={songsPerPlayer}
            topicInput={topicInput}
            onStartBattle={() => setActiveTopic(topicInput.trim() || fallbackTopic)}
            onTopicChange={setTopicInput}
          />
        ) : null}

        {activeTopic && !hasFinishedSubmissions ? (
          <SubmissionSearchPanel
            errorMessage={submissionSearch.errorMessage}
            hasSearched={hasSearchedSubmissions}
            isSearching={submissionSearch.isSearching}
            playerId={currentSubmittingPlayer?.id}
            playerName={currentSubmittingPlayer?.displayName ?? "All players submitted"}
            players={submittingPlayers}
            query={submissionSearch.query}
            results={submissionSearch.results}
            songsPerPlayer={songsPerPlayer}
            submissions={selectedSubmissions}
            topic={topic}
            onPlayPreview={playSongPreview}
            onQueryChange={submissionSearch.setQuery}
            onSearch={() => void searchSubmissionSongs()}
            onSubmitSong={(song) => void selectSubmissionSong(song)}
          />
        ) : null}

        {activeTopic && hasFinishedSubmissions ? (
          <>
        {gameWinnerPlayerId ? (
          <GameOverPanel
            players={roomPlayers}
            pointsToWin={pointsToWin}
            scores={scores}
            winnerName={getPlayerName(gameWinnerPlayerId, roomPlayers)}
            onPlayAgain={resetDemo}
            onResetRoom={resetRoom}
          />
        ) : (
          <>
        <BattleStatusHeader
          judgeName={currentJudge}
          pointsToWin={pointsToWin}
          roomMode={roomMode}
          topic={topic}
        />

        {activeMatchup ? (
          <ActiveMatchupPanel
            matchup={activeMatchup}
            onPickWinner={(submissionId) => void pickWinner(submissionId)}
            onPlayPreview={playSongPreview}
          />
        ) : (
          <RoundResultPanel
            winnerName={roundWinnerPlayerId ? getPlayerName(roundWinnerPlayerId, roomPlayers) : "Pending"}
            winningSongLabel={getWinningSongLabel(roundWinnerPlayerId, selectedSubmissions)}
            onStartNextRound={startNextRound}
          />
        )}

        <Scoreboard players={roomPlayers} scores={scores} />

        <BracketProgress activeMatchupId={activeMatchup?.id} matchups={matchups} />

        <Pressable style={styles.resetButton} onPress={resetDemo}>
          <Text style={styles.resetButtonText}>Reset Demo</Text>
        </Pressable>
          </>
        )}
          </>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getPlayerName(playerId: string, players: Player[]): string {
  return players.find((player) => player.id === playerId)?.displayName ?? "Unknown";
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
    song: createDemoTrack(title, artist),
    submittedAtMs: Date.now(),
  };
}

function createDemoBracket(roundId: string, seed: number, players: Player[]): BracketMatchup[] {
  const submissions = players.map((player, index) => {
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

function isSameSong(firstSong: MediaTrack, secondSong: MediaTrack): boolean {
  return normalizeSongKey(firstSong) === normalizeSongKey(secondSong);
}

function normalizeSongKey(song: MediaTrack): string {
  return `${song.title}:${song.artists.join(",")}`.toLowerCase().trim();
}

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
