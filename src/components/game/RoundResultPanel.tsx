import { Pressable, StyleSheet, Text, View } from "react-native";

export interface RoundResultPanelProps {
  winnerName: string;
  winningSongLabel: string;
  onStartNextRound: () => void;
}

export function RoundResultPanel({
  winnerName,
  winningSongLabel,
  onStartNextRound,
}: RoundResultPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.roundLabel}>Round complete</Text>
      <Text style={styles.winner}>Winner: {winnerName}</Text>
      <Text style={styles.body}>Winning song: {winningSongLabel}</Text>
      <Pressable style={styles.primaryButton} onPress={onStartNextRound}>
        <Text style={styles.primaryButtonText}>Start Next Round</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  roundLabel: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  winner: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "900",
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
});
