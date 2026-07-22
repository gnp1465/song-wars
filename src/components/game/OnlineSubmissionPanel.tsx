import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getOnlineSubmissionCountForMember,
  hasDuplicateOnlineSongSubmission,
} from "../../services/online/onlineRoundSubmissions";
import type { MediaTrack } from "../../types/media";
import type { OnlineRoomMember, OnlineRoundSubmission } from "../../types/onlineRoom";
import { SongActionCard } from "./SongActionCard";

export interface OnlineSubmissionPanelProps {
  audioStatus: string;
  canSubmitSong: boolean;
  contestantMembers: OnlineRoomMember[];
  isJudge: boolean;
  isMutating: boolean;
  isResolvingSubmission: boolean;
  isSearching: boolean;
  ownSubmissions: OnlineRoundSubmission[];
  query: string;
  requiredSubmissionCount: number;
  results: MediaTrack[];
  searchErrorMessage?: string;
  songsPerPlayer: number;
  songsRemaining: number;
  submissions: OnlineRoundSubmission[];
  onChangeQuery: (query: string) => void;
  onClearError: () => void;
  onPlayPreview: (song: MediaTrack) => void;
  onRemoveSubmission: (submissionId: string) => void;
  onSearch: () => void;
  onSubmitSong: (song: MediaTrack) => void;
}

export function OnlineSubmissionPanel({
  audioStatus,
  canSubmitSong,
  contestantMembers,
  isJudge,
  isMutating,
  isResolvingSubmission,
  isSearching,
  ownSubmissions,
  query,
  requiredSubmissionCount,
  results,
  searchErrorMessage,
  songsPerPlayer,
  songsRemaining,
  submissions,
  onChangeQuery,
  onClearError,
  onPlayPreview,
  onRemoveSubmission,
  onSearch,
  onSubmitSong,
}: OnlineSubmissionPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.sectionTitle}>Submission progress</Text>
          <Text style={styles.progressText}>
            {submissions.length}/{requiredSubmissionCount} songs submitted
          </Text>
        </View>
        {isMutating ? <ActivityIndicator color="#38BDF8" /> : null}
      </View>

      {contestantMembers.map((member) => (
        <View key={member.id} style={styles.progressRow}>
          <Text style={styles.memberName}>{member.displayName}</Text>
          <Text style={styles.progressCount}>
            {getOnlineSubmissionCountForMember(submissions, member.id)}/{songsPerPlayer}
          </Text>
        </View>
      ))}

      {isJudge ? (
        <Text style={styles.body}>Waiting for contestants to finish submitting songs.</Text>
      ) : (
        <View style={styles.submissionArea}>
          <Text style={styles.body}>
            You have {songsRemaining} song{songsRemaining === 1 ? "" : "s"} left.
          </Text>

          {ownSubmissions.length > 0 ? (
            <View style={styles.submittedList}>
              <Text style={styles.sectionTitle}>Your songs</Text>
              {ownSubmissions.map((submission) => (
                <View key={submission.id} style={styles.submittedRow}>
                  <View style={styles.submittedText}>
                    <Text style={styles.submittedTitle}>{submission.song.title}</Text>
                    <Text style={styles.submittedArtist}>
                      {submission.song.artists.join(", ")}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${submission.song.title}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isMutating }}
                    disabled={isMutating}
                    style={[styles.smallButton, isMutating ? styles.disabledButton : undefined]}
                    onPress={() => onRemoveSubmission(submission.id)}
                  >
                    <Text style={styles.smallButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {songsRemaining > 0 ? (
            <>
              <TextInput
                accessibilityLabel="Search for a song"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isMutating && !isSearching}
                onChangeText={(nextQuery) => {
                  onChangeQuery(nextQuery);
                  onClearError();
                }}
                onSubmitEditing={onSearch}
                placeholder="Search song or artist"
                placeholderTextColor="#64748B"
                returnKeyType="search"
                style={styles.input}
                value={query}
              />
              <Pressable
                accessibilityLabel="Search songs"
                accessibilityRole="button"
                accessibilityState={{ disabled: isSearching }}
                disabled={isSearching}
                style={[styles.primaryButton, isSearching ? styles.disabledButton : undefined]}
                onPress={onSearch}
              >
                {isSearching ? (
                  <ActivityIndicator color="#082F49" />
                ) : (
                  <Text style={styles.primaryButtonText}>Search</Text>
                )}
              </Pressable>
              <Text style={styles.audioStatus}>{audioStatus}</Text>
              {searchErrorMessage ? <Text style={styles.errorText}>{searchErrorMessage}</Text> : null}
              {results.length > 0 ? (
                <View style={styles.resultsList}>
                  {results.map((song) => {
                    const isDuplicate = hasDuplicateOnlineSongSubmission(submissions, song);

                    return (
                      <SongActionCard
                        key={`${song.id}:${song.title}`}
                        primaryDisabled={!canSubmitSong || isResolvingSubmission || isDuplicate}
                        primaryLabel={
                          isResolvingSubmission
                            ? "Checking..."
                            : isDuplicate
                              ? "Already Picked"
                              : "Submit"
                        }
                        secondaryDisabled={isResolvingSubmission}
                        secondaryLabel="Play Preview"
                        song={song}
                        onPrimaryPress={() => onSubmitSong(song)}
                        onSecondaryPress={() => onPlayPreview(song)}
                      />
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.body}>Your songs are locked in.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  audioStatus: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
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
  input: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  memberName: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
  panel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
  },
  progressCount: {
    color: "#7DD3FC",
    fontSize: 16,
    fontWeight: "900",
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressRow: {
    alignItems: "center",
    borderColor: "#334155",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  progressText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  resultsList: {
    gap: 10,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  smallButton: {
    alignItems: "center",
    borderColor: "#FCA5A5",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900",
  },
  submissionArea: {
    gap: 10,
  },
  submittedArtist: {
    color: "#94A3B8",
    fontSize: 14,
  },
  submittedList: {
    gap: 8,
  },
  submittedRow: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
  },
  submittedText: {
    flex: 1,
    gap: 2,
  },
  submittedTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
  },
});
