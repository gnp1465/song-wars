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
      <Text style={styles.eyebrow}>Round complete</Text>
      <Text style={styles.title}>{winnerName} wins</Text>
      <Text style={styles.body}>{winningSongLabel}</Text>
      <Text style={styles.nextJudge}>Next judge: {winnerName}</Text>
      <Pressable
        accessibilityHint="Starts the next round with the round winner as judge."
        accessibilityLabel="Start next round"
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={onStartNextRound}
      >
        <Text style={styles.primaryButtonText}>Start Next Round</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
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
  nextJudge: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 6,
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
  },
});
