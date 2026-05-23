import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MediaTrack } from "../../types/media";

export interface SongActionCardProps {
  song?: MediaTrack;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

export function SongActionCard({
  song,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: SongActionCardProps) {
  if (!song) {
    return (
      <View style={styles.songPanel}>
        <Text style={styles.songTitle}>Bye</Text>
      </View>
    );
  }

  return (
    <View style={styles.songPanel}>
      <Text style={styles.songTitle}>{song.title}</Text>
      <Text style={styles.songArtist}>{song.artists.join(", ")}</Text>
      <View style={styles.songActions}>
        {secondaryLabel && onSecondaryPress ? (
          <Pressable style={styles.playButton} onPress={onSecondaryPress}>
            <Text style={styles.playButtonText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.pickButton} onPress={onPrimaryPress}>
          <Text style={styles.pickButtonText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  songPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minHeight: 106,
    padding: 16,
  },
  songTitle: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  songArtist: {
    color: "#94A3B8",
    fontSize: 15,
  },
  songActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  playButton: {
    alignItems: "center",
    borderColor: "#38BDF8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  playButtonText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "800",
  },
  pickButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  pickButtonText: {
    color: "#082F49",
    fontSize: 14,
    fontWeight: "900",
  },
});
