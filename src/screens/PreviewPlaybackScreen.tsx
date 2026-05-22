import { Audio } from "expo-av";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import type { MediaTrack } from "../types/media";

type PlaybackStatus = "idle" | "loading" | "playing" | "stopped" | "failed";

export function PreviewPlaybackScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [query, setQuery] = useState("Espresso Sabrina Carpenter");
  const [results, setResults] = useState<MediaTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trackLabel, setTrackLabel] = useState<string | undefined>();

  async function searchTracks() {
    setIsSearching(true);
    setErrorMessage(undefined);

    try {
      const provider = new AppleITunesProvider();
      const searchResults = await provider.searchTracks({
        query,
        storefrontCode: "US",
        limit: 8,
      });
      setResults(searchResults.map((result) => result.track));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Song search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  async function playPreview(track: MediaTrack) {
    setStatus("loading");
    setErrorMessage(undefined);

    try {
      await stopPreview();

      if (!track.preview?.streamUrl) {
        throw new Error("This song does not have an in-app preview available.");
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.preview.streamUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setTrackLabel(formatTrackLabel(track));
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
          Search for a song, choose a result, and play the preview inside the app.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search songs"
            placeholderTextColor="#64748B"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          <Pressable style={styles.searchButton} onPress={searchTracks}>
            <Text style={styles.searchButtonText}>{isSearching ? "..." : "Search"}</Text>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          {status === "loading" ? <ActivityIndicator color="#F9FAFB" /> : null}
          <Text style={styles.status}>Status: {status}</Text>
        </View>

        {trackLabel ? <Text style={styles.track}>{trackLabel}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow} onPress={() => playPreview(item)}>
              <View style={styles.resultText}>
                <Text numberOfLines={1} style={styles.resultTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.resultArtist}>
                  {item.artists.join(", ") || "Unknown artist"}
                </Text>
              </View>
              <Text style={styles.previewBadge}>{item.preview ? "Play" : "No preview"}</Text>
            </Pressable>
          )}
          scrollEnabled={false}
        />

        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={stopPreview}>
            <Text style={styles.secondaryButtonText}>Stop</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function formatTrackLabel(track: MediaTrack): string {
  return `${track.title} - ${track.artists.join(", ") || "Unknown artist"}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    gap: 18,
    paddingTop: 28,
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
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 86,
  },
  searchButtonText: {
    color: "#082F49",
    fontSize: 15,
    fontWeight: "800",
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
  resultRow: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 62,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  resultArtist: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  previewBadge: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
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
