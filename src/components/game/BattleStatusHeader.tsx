import { StyleSheet, Text, View } from "react-native";
import type { RoomMode } from "../../types/game";
import { TurnGuidance } from "./TurnGuidance";

export interface BattleStatusHeaderProps {
  judgeName: string;
  pointsToWin: number;
  roomMode: RoomMode;
  topic: string;
}

export function BattleStatusHeader({
  judgeName,
  pointsToWin,
  roomMode,
  topic,
}: BattleStatusHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>Judging</Text>
      <Text style={styles.title}>Song Wars</Text>
      <TurnGuidance
        actorName={judgeName}
        detail={`Topic: ${topic}`}
        instruction="Play the previews, compare the songs, then pick the winner."
        phaseLabel="Judge turn"
      />
      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{getRoomModeLabel(roomMode)}</Text>
        <Text style={styles.metaPill}>First to {pointsToWin}</Text>
      </View>
    </View>
  );
}

function getRoomModeLabel(roomMode: RoomMode): string {
  return roomMode === "single_speaker" ? "Single Speaker" : "Remote Sync";
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  metaPill: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
