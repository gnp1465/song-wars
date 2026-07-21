import { StyleSheet, Text, View } from "react-native";
import type { BracketMatchup } from "../../types/game";
import type { MediaTrack } from "../../types/media";
import { SongActionCard } from "./SongActionCard";

export interface ActiveMatchupPanelProps {
  isPickingWinner?: boolean;
  matchup: BracketMatchup;
  onPickWinner: (submissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
  showPreviewActions?: boolean;
}

export function ActiveMatchupPanel({
  isPickingWinner = false,
  matchup,
  onPickWinner,
  onPlayPreview,
  showPreviewActions = true,
}: ActiveMatchupPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.roundLabel}>Bracket Round {matchup.roundNumber}</Text>
      <SongChoice
        entry={matchup.left}
        isPickingWinner={isPickingWinner}
        showPreviewActions={showPreviewActions}
        onPick={onPickWinner}
        onPlayPreview={onPlayPreview}
      />
      <Text style={styles.vs}>vs</Text>
      <SongChoice
        entry={matchup.right}
        isPickingWinner={isPickingWinner}
        showPreviewActions={showPreviewActions}
        onPick={onPickWinner}
        onPlayPreview={onPlayPreview}
      />
    </View>
  );
}

interface SongChoiceProps {
  entry: BracketMatchup["left"];
  isPickingWinner: boolean;
  showPreviewActions: boolean;
  onPick: (submissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
}

function SongChoice({
  entry,
  isPickingWinner,
  showPreviewActions,
  onPick,
  onPlayPreview,
}: SongChoiceProps) {
  return (
    <SongActionCard
      song={entry?.song}
      primaryDisabled={isPickingWinner}
      primaryLabel={isPickingWinner ? "Saving..." : "Pick Winner"}
      secondaryDisabled={isPickingWinner}
      secondaryLabel={entry && showPreviewActions ? "Play Preview" : undefined}
      onPrimaryPress={entry ? () => onPick(entry.submissionId) : undefined}
      onSecondaryPress={entry && showPreviewActions ? () => onPlayPreview(entry.song) : undefined}
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
