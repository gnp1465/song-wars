import { Pressable, StyleSheet, Text, View } from "react-native";

export interface AudioStatusBarProps {
  status: string;
  onStop: () => void;
}

export function AudioStatusBar({ status, onStop }: AudioStatusBarProps) {
  const statusKind = getAudioStatusKind(status);
  const canStop = statusKind === "playing" || statusKind === "loading";

  return (
    <View style={styles.audioBar}>
      <View style={styles.statusGroup}>
        <Text style={[styles.statusPill, styles[statusKind]]}>{getAudioStatusLabel(statusKind)}</Text>
        <Text numberOfLines={1} style={styles.audioStatus}>
          {status}
        </Text>
      </View>
      <Pressable
        disabled={!canStop}
        style={[styles.stopButton, !canStop ? styles.disabledStopButton : undefined]}
        onPress={onStop}
      >
        <Text style={styles.stopButtonText}>Stop</Text>
      </Pressable>
    </View>
  );
}

type AudioStatusKind = "idle" | "loading" | "playing" | "error" | "info";

function getAudioStatusKind(status: string): AudioStatusKind {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.startsWith("playing")) {
    return "playing";
  }

  if (normalizedStatus.startsWith("loading") || normalizedStatus.startsWith("searching")) {
    return "loading";
  }

  if (
    normalizedStatus.includes("failed") ||
    normalizedStatus.includes("error") ||
    normalizedStatus.includes("no preview") ||
    normalizedStatus.includes("already submitted")
  ) {
    return "error";
  }

  if (normalizedStatus === "no preview playing" || normalizedStatus === "stopped") {
    return "idle";
  }

  return "info";
}

function getAudioStatusLabel(statusKind: AudioStatusKind): string {
  if (statusKind === "playing") {
    return "Playing";
  }

  if (statusKind === "loading") {
    return "Loading";
  }

  if (statusKind === "error") {
    return "Check";
  }

  if (statusKind === "info") {
    return "Info";
  }

  return "Idle";
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
  statusGroup: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
  idle: {
    backgroundColor: "#334155",
    color: "#E2E8F0",
  },
  loading: {
    backgroundColor: "#1D4ED8",
    color: "#DBEAFE",
  },
  playing: {
    backgroundColor: "#0F766E",
    color: "#CCFBF1",
  },
  error: {
    backgroundColor: "#7F1D1D",
    color: "#FEE2E2",
  },
  info: {
    backgroundColor: "#075985",
    color: "#E0F2FE",
  },
  audioStatus: {
    color: "#F9FAFB",
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
  disabledStopButton: {
    opacity: 0.45,
  },
  stopButtonText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "800",
  },
});
