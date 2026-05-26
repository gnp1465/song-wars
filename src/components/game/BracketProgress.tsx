import { StyleSheet, Text, View } from "react-native";
import type { BracketMatchup } from "../../types/game";

export interface BracketProgressProps {
  activeMatchupId?: string;
  matchups: BracketMatchup[];
}

export function BracketProgress({ activeMatchupId, matchups }: BracketProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bracket</Text>
      {matchups.map((matchup) => (
        <View
          key={matchup.id}
          style={[
            styles.bracketRow,
            matchup.id === activeMatchupId ? styles.activeBracketRow : undefined,
          ]}
        >
          <Text style={styles.bracketRound}>R{matchup.roundNumber}</Text>
          <View style={styles.bracketMain}>
            <Text numberOfLines={1} style={styles.bracketSongs}>
              {getMatchupLabel(matchup)}
            </Text>
            <Text style={styles.bracketStatus}>
              {formatMatchupStatus(matchup, matchup.id === activeMatchupId)}
            </Text>
          </View>
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

function formatMatchupStatus(matchup: BracketMatchup, isActive: boolean): string {
  if (isActive) {
    return "Now judging";
  }

  if (matchup.hasBye && matchup.status === "complete") {
    return "Bye advanced";
  }

  if (matchup.status !== "complete") {
    return matchup.status === "ready" ? "Waiting" : "Pending";
  }

  const winner = [matchup.left, matchup.right].find(
    (entry) => entry?.submissionId === matchup.winnerSubmissionId,
  );

  return `Complete: ${winner?.song.title ?? "Winner"}`;
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: "#111827",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 8,
  },
  activeBracketRow: {
    backgroundColor: "#123044",
    borderBottomColor: "#38BDF8",
  },
  bracketRound: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "900",
    width: 28,
  },
  bracketMain: {
    flex: 1,
    gap: 3,
  },
  bracketSongs: {
    color: "#F9FAFB",
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
