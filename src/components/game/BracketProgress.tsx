import { StyleSheet, Text, View } from "react-native";
import type { BracketMatchup } from "../../types/game";

export interface BracketProgressProps {
  matchups: BracketMatchup[];
}

export function BracketProgress({ matchups }: BracketProgressProps) {
  return (
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
  );
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

const styles = StyleSheet.create({
  scoreboard: {
    gap: 8,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
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
});
