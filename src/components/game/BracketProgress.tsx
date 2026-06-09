import { StyleSheet, Text, View } from "react-native";
import type { BracketMatchup } from "../../types/game";

export interface BracketProgressProps {
  activeMatchupId?: string;
  matchups: BracketMatchup[];
}

export function BracketProgress({ activeMatchupId, matchups }: BracketProgressProps) {
  const matchupsByRound = groupMatchupsByRound(matchups);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bracket</Text>
      {matchupsByRound.map((roundGroup) => (
        <View key={roundGroup.roundNumber} style={styles.roundGroup}>
          <View style={styles.roundHeader}>
            <Text style={styles.roundTitle}>Round {roundGroup.roundNumber}</Text>
            <Text style={styles.roundSummary}>{getRoundSummary(roundGroup.matchups)}</Text>
          </View>

          {roundGroup.matchups.map((matchup) => {
            const status = getMatchupStatus(matchup, matchup.id === activeMatchupId);

            return (
              <View
                key={matchup.id}
                style={[
                  styles.bracketRow,
                  matchup.id === activeMatchupId ? styles.activeBracketRow : undefined,
                ]}
              >
                <View style={styles.bracketMain}>
                  <Text numberOfLines={1} style={styles.bracketSongs}>
                    {getMatchupLabel(matchup)}
                  </Text>
                  <Text numberOfLines={1} style={styles.winnerText}>
                    {getWinnerLabel(matchup)}
                  </Text>
                </View>
                <Text style={[styles.statusPill, styles[status.kind]]}>{status.label}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface MatchupRoundGroup {
  matchups: BracketMatchup[];
  roundNumber: number;
}

function groupMatchupsByRound(matchups: BracketMatchup[]): MatchupRoundGroup[] {
  const roundNumbers = Array.from(
    new Set(matchups.map((matchup) => matchup.roundNumber)),
  ).sort((firstRound, secondRound) => firstRound - secondRound);

  return roundNumbers.map((roundNumber) => ({
    roundNumber,
    matchups: matchups.filter((matchup) => matchup.roundNumber === roundNumber),
  }));
}

function getMatchupLabel(matchup: BracketMatchup): string {
  const leftTitle = matchup.left?.song.title ?? "Bye";
  const rightTitle = matchup.right?.song.title ?? "Bye";

  return `${leftTitle} vs ${rightTitle}`;
}

type MatchupStatusKind = "activeStatus" | "completeStatus" | "pendingStatus" | "byeStatus";

interface MatchupStatus {
  kind: MatchupStatusKind;
  label: string;
}

function getMatchupStatus(matchup: BracketMatchup, isActive: boolean): MatchupStatus {
  if (isActive) {
    return {
      kind: "activeStatus",
      label: "Now",
    };
  }

  if (matchup.hasBye && matchup.status === "complete") {
    return {
      kind: "byeStatus",
      label: "Bye",
    };
  }

  if (matchup.status !== "complete") {
    return {
      kind: "pendingStatus",
      label: matchup.status === "ready" ? "Waiting" : "Pending",
    };
  }

  return {
    kind: "completeStatus",
    label: "Done",
  };
}

function getWinnerLabel(matchup: BracketMatchup): string {
  const winner = [matchup.left, matchup.right].find(
    (entry) => entry?.submissionId === matchup.winnerSubmissionId,
  );

  if (matchup.hasBye && matchup.status === "complete") {
    return `${winner?.song.title ?? "Song"} advanced automatically`;
  }

  if (matchup.status === "complete") {
    return `Winner: ${winner?.song.title ?? "Song"}`;
  }

  return "Winner pending";
}

function getRoundSummary(matchups: BracketMatchup[]): string {
  const completeCount = matchups.filter((matchup) => matchup.status === "complete").length;

  return `${completeCount}/${matchups.length} complete`;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  roundGroup: {
    gap: 8,
  },
  roundHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roundTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
  },
  roundSummary: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  bracketRow: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "#243244",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  activeBracketRow: {
    backgroundColor: "#123044",
    borderColor: "#38BDF8",
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
  winnerText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "900",
    minWidth: 62,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  activeStatus: {
    backgroundColor: "#0E7490",
    color: "#ECFEFF",
  },
  completeStatus: {
    backgroundColor: "#14532D",
    color: "#DCFCE7",
  },
  pendingStatus: {
    backgroundColor: "#334155",
    color: "#E2E8F0",
  },
  byeStatus: {
    backgroundColor: "#713F12",
    color: "#FEF3C7",
  },
});
