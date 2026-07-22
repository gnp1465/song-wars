import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RemotePreviewPlaybackState } from "../../hooks/useRemotePreviewPlayback";
import type { MatchupEntry } from "../../types/game";

interface RemotePlaybackControlsProps {
  isDisabled: boolean;
  left?: MatchupEntry;
  right?: MatchupEntry;
  onSchedule: (entry: MatchupEntry | undefined) => void;
}

export function RemotePlaybackControls({
  isDisabled,
  left,
  right,
  onSchedule,
}: RemotePlaybackControlsProps) {
  return (
    <View style={styles.syncedPreviewArea}>
      <Text style={styles.sectionTitle}>Remote sync</Text>
      <View style={styles.syncedPreviewButtons}>
        <Pressable
          accessibilityLabel={`Start synced preview for ${left?.song.title ?? "left song"}`}
          accessibilityRole="button"
          disabled={isDisabled || !left}
          style={[
            styles.scheduleButton,
            isDisabled || !left ? styles.disabledButton : undefined,
          ]}
          onPress={() => onSchedule(left)}
        >
          <Text style={styles.scheduleButtonText}>Play Left</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Start synced preview for ${right?.song.title ?? "right song"}`}
          accessibilityRole="button"
          disabled={isDisabled || !right}
          style={[
            styles.scheduleButton,
            isDisabled || !right ? styles.disabledButton : undefined,
          ]}
          onPress={() => onSchedule(right)}
        >
          <Text style={styles.scheduleButtonText}>Play Right</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface RemotePlaybackPanelProps {
  playback: RemotePreviewPlaybackState;
}

export function RemotePlaybackPanel({ playback }: RemotePlaybackPanelProps) {
  if (playback.phase === "idle") {
    return null;
  }

  return (
    <View style={styles.remotePlaybackPanel}>
      <View style={styles.progressHeader}>
        <Text style={styles.sectionTitle}>Synced listening</Text>
        <Text style={playback.isLocked ? styles.readyText : styles.body}>
          {playback.isLocked ? "Locked" : "Open"}
        </Text>
      </View>
      <Text style={styles.body}>{playback.statusLabel}</Text>
      {playback.errorMessage ? <Text style={styles.errorText}>{playback.errorMessage}</Text> : null}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(playback.progress * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  disabledButton: {
    opacity: 0.45,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  progressFill: {
    backgroundColor: "#38BDF8",
    height: 8,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    backgroundColor: "#334155",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  readyText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "800",
  },
  remotePlaybackPanel: {
    backgroundColor: "#111827",
    borderColor: "#38BDF8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  scheduleButton: {
    alignItems: "center",
    borderColor: "#38BDF8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  scheduleButtonText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  syncedPreviewArea: {
    gap: 8,
  },
  syncedPreviewButtons: {
    flexDirection: "row",
    gap: 10,
  },
});
