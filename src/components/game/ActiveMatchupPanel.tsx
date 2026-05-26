import { StyleSheet, Text, View } from "react-native";
import type { BracketMatchup } from "../../types/game";
import type { MediaTrack } from "../../types/media";
import { SongActionCard } from "./SongActionCard";

export interface ActiveMatchupPanelProps {
  matchup: BracketMatchup;
  onPickWinner: (submissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
}

export function ActiveMatchupPanel({
  matchup,
  onPickWinner,
  onPlayPreview,
}: ActiveMatchupPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.roundLabel}>Bracket Round {matchup.roundNumber}</Text>
      <SongChoice
        entry={matchup.left}
        onPick={onPickWinner}
        onPlayPreview={onPlayPreview}
      />
      <Text style={styles.vs}>vs</Text>
      <SongChoice
        entry={matchup.right}
        onPick={onPickWinner}
        onPlayPreview={onPlayPreview}
      />
    </View>
  );
}

interface SongChoiceProps {
  entry: BracketMatchup["left"];
  onPick: (submissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
}

function SongChoice({ entry, onPick, onPlayPreview }: SongChoiceProps) {
  return (
    <SongActionCard
      song={entry?.song}
      primaryLabel="Pick Winner"
      secondaryLabel={entry ? "Play Preview" : undefined}
      onPrimaryPress={entry ? () => onPick(entry.submissionId) : undefined}
      onSecondaryPress={entry ? () => onPlayPreview(entry.song) : undefined}
    />
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
  vs: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
});
