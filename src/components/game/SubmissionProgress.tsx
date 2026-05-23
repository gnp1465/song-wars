import { StyleSheet, Text, View } from "react-native";
import type { Player, SongSubmission } from "../../types/game";

export interface SubmissionProgressProps {
  players: Player[];
  submissions: SongSubmission[];
}

export function SubmissionProgress({ players, submissions }: SubmissionProgressProps) {
  return (
    <View style={styles.progressPanel}>
      {players.map((player) => {
        const hasSubmitted = submissions.some((submission) => submission.playerId === player.id);

        return (
          <View key={player.id} style={styles.progressRow}>
            <Text style={styles.progressName}>{player.displayName}</Text>
            <Text style={hasSubmitted ? styles.progressDone : styles.progressPending}>
              {hasSubmitted ? "Submitted" : "Waiting"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 32,
  },
  progressName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },
  progressDone: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
  },
  progressPending: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },
});
