import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  generateBracket,
  generateNextRoundMatchups,
  selectMatchupWinner,
} from "../services/game/bracket";
import { completeRound, type PlayerScore } from "../services/game/scoring";
import type { BracketMatchup, Player, SongSubmission } from "../types/game";
import type { MediaTrack } from "../types/media";

const ROUND_ID = "demo-round-1";

const PLAYERS: Player[] = [
  { id: "player-1", displayName: "Gus", isHost: true, isGuest: false },
  { id: "player-2", displayName: "Maya", isHost: false, isGuest: true },
  { id: "player-3", displayName: "Jay", isHost: false, isGuest: true },
  { id: "player-4", displayName: "Nina", isHost: false, isGuest: true },
];

const SUBMISSIONS: SongSubmission[] = [
  createSubmission("sub-1", "player-1", "Espresso", "Sabrina Carpenter"),
  createSubmission("sub-2", "player-2", "Blinding Lights", "The Weeknd"),
  createSubmission("sub-3", "player-3", "Golden", "Harry Styles"),
  createSubmission("sub-4", "player-4", "Levitating", "Dua Lipa"),
];

export function LocalBattleDemoScreen() {
  const initialBracket = useMemo(
    () => generateBracket({ roundId: ROUND_ID, submissions: SUBMISSIONS, seed: 42 }),
    [],
  );
  const [topic] = useState("Beach vibes");
  const [judgePlayerId, setJudgePlayerId] = useState("player-1");
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [activeRoundNumber, setActiveRoundNumber] = useState(1);
  const [matchups, setMatchups] = useState<BracketMatchup[]>(initialBracket);
  const [roundWinnerPlayerId, setRoundWinnerPlayerId] = useState<string | undefined>();

  const activeMatchup = matchups.find(
    (matchup) => matchup.roundNumber === activeRoundNumber && matchup.status === "ready",
  );
  const currentJudge = getPlayerName(judgePlayerId);

  function pickWinner(winnerSubmissionId: string) {
    if (!activeMatchup) {
      return;
    }

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
    const nextRoundMatchups = generateNextRoundMatchups(ROUND_ID, currentRoundMatchups);

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

  function resetDemo() {
    setJudgePlayerId("player-1");
    setScores([]);
    setActiveRoundNumber(1);
    setMatchups(initialBracket);
    setRoundWinnerPlayerId(undefined);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Local Battle Demo</Text>
          <Text style={styles.title}>Song Wars</Text>
          <Text style={styles.body}>Topic: {topic}</Text>
          <Text style={styles.body}>Judge: {currentJudge}</Text>
        </View>

        {activeMatchup ? (
          <View style={styles.matchup}>
            <Text style={styles.roundLabel}>Round {activeMatchup.roundNumber}</Text>
            <SongChoice entry={activeMatchup.left} onPick={pickWinner} />
            <Text style={styles.vs}>vs</Text>
            <SongChoice entry={activeMatchup.right} onPick={pickWinner} />
          </View>
        ) : (
          <View style={styles.matchup}>
            <Text style={styles.roundLabel}>Round complete</Text>
            <Text style={styles.winner}>
              Winner: {roundWinnerPlayerId ? getPlayerName(roundWinnerPlayerId) : "Pending"}
            </Text>
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

        <Pressable style={styles.resetButton} onPress={resetDemo}>
          <Text style={styles.resetButtonText}>Reset Demo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SongChoiceProps {
  entry: BracketMatchup["left"];
  onPick: (submissionId: string) => void;
}

function SongChoice({ entry, onPick }: SongChoiceProps) {
  if (!entry) {
    return (
      <View style={styles.songPanel}>
        <Text style={styles.songTitle}>Bye</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.songPanel} onPress={() => onPick(entry.submissionId)}>
      <Text style={styles.songTitle}>{entry.song.title}</Text>
      <Text style={styles.songArtist}>{entry.song.artists.join(", ")}</Text>
      <Text style={styles.pickHint}>Pick winner</Text>
    </Pressable>
  );
}

function getScore(playerId: string, scores: PlayerScore[]): number {
  return scores.find((score) => score.playerId === playerId)?.points ?? 0;
}

function getPlayerName(playerId: string): string {
  return PLAYERS.find((player) => player.id === playerId)?.displayName ?? "Unknown";
}

function createSubmission(
  id: string,
  playerId: string,
  title: string,
  artist: string,
): SongSubmission {
  return {
    id,
    playerId,
    roundId: ROUND_ID,
    song: createTrack(title, artist),
    submittedAtMs: Date.now(),
  };
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

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
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
  matchup: {
    gap: 12,
  },
  roundLabel: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  songPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minHeight: 106,
    padding: 16,
  },
  songTitle: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  songArtist: {
    color: "#94A3B8",
    fontSize: 15,
  },
  pickHint: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
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
