import { Audio } from "expo-av";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";

const TEST_QUERY = "Espresso Sabrina Carpenter";

type PlaybackStatus = "idle" | "loading" | "playing" | "stopped" | "failed";

export function PreviewPlaybackScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [trackLabel, setTrackLabel] = useState<string | undefined>();

  async function playPreview() {
    setStatus("loading");
    setErrorMessage(undefined);

    try {
      await stopPreview();
      const provider = new AppleITunesProvider();
      const results = await provider.searchTracks({
        query: TEST_QUERY,
        storefrontCode: "US",
        limit: 5,
      });
      const playableTrack = results.map((result) => result.track).find((track) => track.preview?.streamUrl);

      if (!playableTrack?.preview?.streamUrl) {
        throw new Error("No playable Apple/iTunes preview was found for the test track.");
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: playableTrack.preview.streamUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setTrackLabel(`${playableTrack.title} - ${playableTrack.artists.join(", ")}`);
      setStatus("playing");
    } catch (error) {
      setStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Preview playback failed.");
    }
  }

  async function stopPreview() {
    if (!soundRef.current) {
      setStatus((currentStatus) => (currentStatus === "playing" ? "stopped" : currentStatus));
      return;
    }

    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
    soundRef.current = null;
    setStatus("stopped");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Audio Test</Text>
        <Text style={styles.title}>Song Wars Preview Playback</Text>
        <Text style={styles.body}>
          This screen fetches a fresh Apple/iTunes preview, then plays it inside
          the app so you can test real iPhone audio.
        </Text>

        <View style={styles.statusRow}>
          {status === "loading" ? <ActivityIndicator color="#F9FAFB" /> : null}
          <Text style={styles.status}>Status: {status}</Text>
        </View>

        {trackLabel ? <Text style={styles.track}>{trackLabel}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={playPreview}>
            <Text style={styles.primaryButtonText}>Play Preview</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={stopPreview}>
            <Text style={styles.secondaryButtonText}>Stop</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    gap: 18,
  },
  eyebrow: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 38,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 24,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 28,
  },
  status: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  track: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 22,
  },
  secondaryButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
});
