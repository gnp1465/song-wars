import { StyleSheet, Text, View } from "react-native";
import type { Player } from "../../types/game";
import type { PlayerScore } from "../../services/game/scoring";

export interface ScoreboardProps {
  players: Player[];
  scores: PlayerScore[];
}

export function Scoreboard({ players, scores }: ScoreboardProps) {
  return (
    <View style={styles.scoreboard}>
      <Text style={styles.sectionTitle}>Scoreboard</Text>
      {players.map((player) => (
        <View key={player.id} style={styles.scoreRow}>
          <Text style={styles.scoreName}>{player.displayName}</Text>
          <Text style={styles.scoreValue}>{getScore(player.id, scores)}</Text>
        </View>
      ))}
    </View>
  );
}

function getScore(playerId: string, scores: PlayerScore[]): number {
  return scores.find((score) => score.playerId === playerId)?.points ?? 0;
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
});
