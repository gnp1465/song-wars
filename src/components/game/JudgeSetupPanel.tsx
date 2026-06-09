import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { RoomMode } from "../../types/game";
import { TurnGuidance } from "./TurnGuidance";

export interface JudgeSetupPanelProps {
  judgeName: string;
  pointsToWin: number;
  roomMode: RoomMode;
  songsPerPlayer: number;
  topicInput: string;
  onStartBattle: () => void;
  onTopicChange: (topic: string) => void;
}

export function JudgeSetupPanel({
  judgeName,
  pointsToWin,
  roomMode,
  songsPerPlayer,
  topicInput,
  onStartBattle,
  onTopicChange,
}: JudgeSetupPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Judge Setup</Text>
      <Text style={styles.title}>Choose the topic</Text>
      <TurnGuidance
        actorName={judgeName}
        detail="Everyone else will submit songs after the topic is locked."
        instruction="Set the prompt for this round."
        phaseLabel="Judge turn"
      />
      <View style={styles.settingsPanel}>
        <Text style={styles.sectionTitle}>Room settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Songs per player</Text>
          <Text style={styles.settingValue}>{songsPerPlayer}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Audio mode</Text>
          <Text style={styles.settingValue}>{getRoomModeLabel(roomMode)}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Points to win</Text>
          <Text style={styles.settingValue}>{pointsToWin}</Text>
        </View>
      </View>
      <TextInput
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={onTopicChange}
        placeholder="Round topic"
        placeholderTextColor="#64748B"
        style={styles.input}
        value={topicInput}
      />
      <Pressable style={styles.primaryButton} onPress={onStartBattle}>
        <Text style={styles.primaryButtonText}>Start Battle</Text>
      </Pressable>
    </View>
  );
}

function getRoomModeLabel(roomMode: RoomMode): string {
  return roomMode === "single_speaker" ? "Single Speaker" : "Remote Sync";
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
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
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
  settingsPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingLabel: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  settingValue: {
    color: "#38BDF8",
    fontSize: 18,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
});
