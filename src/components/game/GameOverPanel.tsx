import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Player } from "../../types/game";
import type { PlayerScore } from "../../services/game/scoring";
import { Scoreboard } from "./Scoreboard";

export interface GameOverPanelProps {
  players: Player[];
  pointsToWin: number;
  scores: PlayerScore[];
  winnerName: string;
  onPlayAgain: () => void;
  onResetRoom: () => void;
}

export function GameOverPanel({
  players,
  pointsToWin,
  scores,
  winnerName,
  onPlayAgain,
  onResetRoom,
}: GameOverPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Game Complete</Text>
      <Text style={styles.title}>{winnerName} wins</Text>
      <Text style={styles.body}>First to {pointsToWin} points takes the game.</Text>

      <Scoreboard players={players} scores={scores} />

      <Pressable
        accessibilityHint="Starts a fresh game with the same room players and settings."
        accessibilityLabel="Play again"
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={onPlayAgain}
      >
        <Text style={styles.primaryButtonText}>Play Again</Text>
      </Pressable>
      <Pressable
        accessibilityHint="Returns to room creation."
        accessibilityLabel="Reset room"
        accessibilityRole="button"
        style={styles.secondaryButton}
        onPress={onResetRoom}
      >
        <Text style={styles.secondaryButtonText}>Reset Room</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
