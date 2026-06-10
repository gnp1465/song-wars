import { useRef, useState } from "react";
import {
  Keyboard,
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
import {
  createSongSubmission,
  getSubmissionSongLabel,
  hasDuplicateSongSubmission,
} from "../services/game/submissions";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import { DEMO_PLAYERS, DEMO_TOPICS } from "../data/demoGame";
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
  const isSubmittingSongRef = useRef(false);
  const isPickingWinnerRef = useRef(false);
  const roomPlayers = players.length >= 2 ? players : DEMO_PLAYERS;
  const initialJudgePlayerId = roomPlayers[0].id;
  const [roundIndex, setRoundIndex] = useState(1);
  const [topicInput, setTopicInput] = useState("Beach vibes");
  const [activeTopic, setActiveTopic] = useState<string | undefined>();
  const [roomMode] = useState(initialRoomMode);
  const [songsPerPlayer] = useState(initialSongsPerPlayer);
  const [submissionStepIndex, setSubmissionStepIndex] = useState(0);
  const [selectedSubmissions, setSelectedSubmissions] = useState<SongSubmission[]>([]);
  const [hasSearchedSubmissions, setHasSearchedSubmissions] = useState(false);
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);
  const submissionSearch = useSongSearch({ initialQuery: "Espresso Sabrina Carpenter" });
  const [judgePlayerId, setJudgePlayerId] = useState(initialJudgePlayerId);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [matchups, setMatchups] = useState<BracketMatchup[]>([]);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [roundWinnerPlayerId, setRoundWinnerPlayerId] = useState<string | undefined>();
  const [roundWinnerSubmissionId, setRoundWinnerSubmissionId] = useState<string | undefined>();
  const [gameWinnerPlayerId, setGameWinnerPlayerId] = useState<string | undefined>();

  const currentRoundId = `demo-round-${roundIndex}`;
  const fallbackTopic = DEMO_TOPICS[(roundIndex - 1) % DEMO_TOPICS.length];
  const topic = activeTopic ?? fallbackTopic;
  const submittingPlayers = roomPlayers.filter((player) => player.id !== judgePlayerId);
  const currentSubmittingPlayer = submittingPlayers[submissionStepIndex];
  const requiredSubmissionCount = submittingPlayers.length * songsPerPlayer;
  const hasFinishedSubmissions = selectedSubmissions.length >= requiredSubmissionCount;
  const activeMatchup = matchups.find(
    (matchup) => matchup.roundNumber === activeRoundNumber && matchup.status === "ready",
  );
  const currentJudge = getPlayerName(judgePlayerId, roomPlayers);

  async function pickWinner(winnerSubmissionId: string) {
    if (!activeMatchup || isPickingWinnerRef.current) {
      return;
    }

    isPickingWinnerRef.current = true;
    setIsPickingWinner(true);

    try {
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
      setRoundWinnerSubmissionId(roundResult.winningSubmissionId);
      setGameWinnerPlayerId(gameWinner?.playerId);
    } finally {
      isPickingWinnerRef.current = false;
      setIsPickingWinner(false);
    }
  }

  function resetDemo() {
    void stopSongPreview("No preview playing");
    setRoundIndex(1);
    setTopicInput("Beach vibes");
    setActiveTopic(undefined);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setHasSearchedSubmissions(false);
    setIsSubmittingSong(false);
    isSubmittingSongRef.current = false;
    setJudgePlayerId(initialJudgePlayerId);
    setScores([]);
    setActiveRoundNumber(1);
    setMatchups([]);
    setIsPickingWinner(false);
    isPickingWinnerRef.current = false;
    setRoundWinnerPlayerId(undefined);
    setRoundWinnerSubmissionId(undefined);
    setGameWinnerPlayerId(undefined);
  }

  function resetRoom() {
    void stopSongPreview("No preview playing");
    onResetRoom?.();
  }

  function startNextRound() {
    void stopSongPreview("No preview playing");

    const nextRoundIndex = roundIndex + 1;
    const nextTopic = DEMO_TOPICS[(nextRoundIndex - 1) % DEMO_TOPICS.length];

    setRoundIndex(nextRoundIndex);
    setTopicInput(nextTopic);
    setActiveTopic(undefined);
    setSubmissionStepIndex(0);
    setSelectedSubmissions([]);
    setHasSearchedSubmissions(false);
    setIsSubmittingSong(false);
    isSubmittingSongRef.current = false;
    setActiveRoundNumber(1);
    setMatchups([]);
    setIsPickingWinner(false);
    isPickingWinnerRef.current = false;
    setRoundWinnerPlayerId(undefined);
    setRoundWinnerSubmissionId(undefined);
    setGameWinnerPlayerId(undefined);
  }

  async function selectSubmissionSong(song: MediaTrack) {
    const submittingPlayer = submittingPlayers[submissionStepIndex];

    if (!submittingPlayer || isSubmittingSongRef.current) {
      return;
    }

    isSubmittingSongRef.current = true;
    setIsSubmittingSong(true);

    try {
      const isDuplicate = hasDuplicateSongSubmission(selectedSubmissions, song);

      if (isDuplicate) {
        setAudioStatus("That song was already submitted. Pick a different one.");
        return;
      }

      await stopSongPreview();

      const submission = createSongSubmission({
        id: `${currentRoundId}:sub-${selectedSubmissions.length + 1}`,
        playerId: submittingPlayer.id,
        roundId: currentRoundId,
        song,
      });
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

      if (nextSubmissions.length >= requiredSubmissionCount) {
        setMatchups(
          generateBracket({
            roundId: currentRoundId,
            submissions: nextSubmissions,
            seed: 42 + roundIndex,
          }),
        );
        setActiveRoundNumber(1);
      }
    } finally {
      isSubmittingSongRef.current = false;
      setIsSubmittingSong(false);
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

  function startBattleTopic() {
    Keyboard.dismiss();
    setActiveTopic(topicInput.trim() || fallbackTopic);
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
            onStartBattle={startBattleTopic}
            onTopicChange={setTopicInput}
          />
        ) : null}

        {activeTopic && !hasFinishedSubmissions ? (
          <SubmissionSearchPanel
            errorMessage={submissionSearch.errorMessage}
            hasSearched={hasSearchedSubmissions}
            isSearching={submissionSearch.isSearching}
            isSubmittingSong={isSubmittingSong}
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
            isPickingWinner={isPickingWinner}
            matchup={activeMatchup}
            onPickWinner={(submissionId) => void pickWinner(submissionId)}
            onPlayPreview={playSongPreview}
          />
        ) : (
          <RoundResultPanel
            winnerName={roundWinnerPlayerId ? getPlayerName(roundWinnerPlayerId, roomPlayers) : "Pending"}
            winningSongLabel={getSubmissionSongLabel(selectedSubmissions, roundWinnerSubmissionId)}
            onStartNextRound={startNextRound}
          />
        )}

        <Scoreboard players={roomPlayers} scores={scores} />

        <BracketProgress activeMatchupId={activeMatchup?.id} matchups={matchups} />

        <Pressable
          accessibilityHint="Restarts the current local game from round one."
          accessibilityLabel="Reset game"
          accessibilityRole="button"
          style={styles.resetButton}
          onPress={resetDemo}
        >
          <Text style={styles.resetButtonText}>Reset Game</Text>
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
