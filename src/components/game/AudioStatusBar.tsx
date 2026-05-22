import { Pressable, StyleSheet, Text, View } from "react-native";

export interface AudioStatusBarProps {
  status: string;
  onStop: () => void;
}

export function AudioStatusBar({ status, onStop }: AudioStatusBarProps) {
  return (
    <View style={styles.audioBar}>
      <Text numberOfLines={1} style={styles.audioStatus}>
        {status}
      </Text>
      <Pressable style={styles.stopButton} onPress={onStop}>
        <Text style={styles.stopButtonText}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  audioBar: {
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  audioStatus: {
    color: "#F9FAFB",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  stopButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  stopButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "800",
  },
});
