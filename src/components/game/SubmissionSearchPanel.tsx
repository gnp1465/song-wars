import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Player, SongSubmission } from "../../types/game";
import type { MediaTrack } from "../../types/media";
import { SongActionCard } from "./SongActionCard";
import { SubmissionProgress } from "./SubmissionProgress";
import { TurnGuidance } from "./TurnGuidance";

export interface SubmissionSearchPanelProps {
  errorMessage?: string;
  hasSearched: boolean;
  isSearching: boolean;
  isSubmittingSong?: boolean;
  playerId?: string;
  playerName: string;
  players: Player[];
  query: string;
  results: MediaTrack[];
  songsPerPlayer: number;
  submissions: SongSubmission[];
  topic: string;
  onPlayPreview: (song: MediaTrack) => void;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onSubmitSong: (song: MediaTrack) => void;
}

export function SubmissionSearchPanel({
  errorMessage,
  hasSearched,
  isSearching,
  isSubmittingSong = false,
  playerId,
  playerName,
  players,
  query,
  results,
  songsPerPlayer,
  submissions,
  topic,
  onPlayPreview,
  onQueryChange,
  onSearch,
  onSubmitSong,
}: SubmissionSearchPanelProps) {
  const emptyState = getEmptyState({
    errorMessage,
    hasSearched,
    isSearching,
    resultCount: results.length,
  });
  const currentPlayerSubmissionCount = submissions.filter(
    (submission) => submission.playerId === playerId,
  ).length;
  const songsRemaining = Math.max(songsPerPlayer - currentPlayerSubmissionCount, 0);
  const canSearch = query.trim().length > 0 && !isSearching;

  function handleSearch() {
    if (!canSearch) {
      return;
    }

    Keyboard.dismiss();
    onSearch();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Submissions</Text>
      <Text style={styles.title}>Pick a song</Text>
      <TurnGuidance
        actorName={playerName}
        detail={`Topic: ${topic}`}
        instruction={`Submit ${formatSongCount(songsRemaining)} for this turn.`}
        phaseLabel="Player turn"
      />
      <SubmissionProgress players={players} submissions={submissions} />
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={onQueryChange}
          onSubmitEditing={handleSearch}
          placeholder="Search songs"
          placeholderTextColor="#64748B"
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        <Pressable
          disabled={!canSearch}
          style={[styles.searchButton, !canSearch ? styles.disabledSearchButton : undefined]}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>{isSearching ? "..." : "Search"}</Text>
        </Pressable>
      </View>

      {emptyState ? <Text style={errorMessage ? styles.errorText : styles.emptyText}>{emptyState}</Text> : null}

      <View style={styles.submissionChoices}>
        {results.map((song) => (
          <SongActionCard
            key={song.id}
            song={song}
            primaryDisabled={isSubmittingSong}
            primaryLabel={isSubmittingSong ? "Submitting..." : "Submit"}
            secondaryDisabled={isSubmittingSong}
            secondaryLabel="Play Preview"
            onPrimaryPress={() => onSubmitSong(song)}
            onSecondaryPress={() => onPlayPreview(song)}
          />
        ))}
      </View>
    </View>
  );
}

function formatSongCount(songCount: number): string {
  return songCount === 1 ? "1 song" : `${songCount} songs`;
}

interface EmptyStateOptions {
  errorMessage?: string;
  hasSearched: boolean;
  isSearching: boolean;
  resultCount: number;
}

function getEmptyState({
  errorMessage,
  hasSearched,
  isSearching,
  resultCount,
}: EmptyStateOptions): string | undefined {
  if (errorMessage) {
    return errorMessage;
  }

  if (isSearching) {
    return "Searching...";
  }

  if (hasSearched && resultCount === 0) {
    return "No songs found. Try a different song or artist.";
  }

  if (!hasSearched && resultCount === 0) {
    return "Search for a song to submit.";
  }

  return undefined;
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
  disabledSearchButton: {
    opacity: 0.45,
  },
  searchButtonText: {
    color: "#082F49",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
  submissionChoices: {
    gap: 12,
  },
});
