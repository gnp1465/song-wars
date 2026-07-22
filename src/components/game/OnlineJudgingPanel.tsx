import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { RemotePreviewPlaybackState } from "../../hooks/useRemotePreviewPlayback";
import type { PlayerScore } from "../../services/game/scoring";
import type { BracketMatchup, MatchupEntry, Player } from "../../types/game";
import type { MediaTrack } from "../../types/media";
import { ActiveMatchupPanel } from "./ActiveMatchupPanel";
import { BracketProgress } from "./BracketProgress";
import { RemotePlaybackControls, RemotePlaybackPanel } from "./OnlineRemotePlayback";
import { Scoreboard } from "./Scoreboard";

export interface OnlineJudgingPanelProps {
  activeMatchup?: BracketMatchup;
  audioStatus: string;
  isJudge: boolean;
  isMutating: boolean;
  isRemoteMode: boolean;
  judgeName: string;
  matchups: BracketMatchup[];
  players: Player[];
  remotePlayback: RemotePreviewPlaybackState;
  scores: PlayerScore[];
  onPickWinner: (winnerSubmissionId: string) => void;
  onPlayPreview: (song: MediaTrack) => void;
  onScheduleSyncedPreview: (entry: MatchupEntry | undefined) => void;
}

export function OnlineJudgingPanel({
  activeMatchup,
  audioStatus,
  isJudge,
  isMutating,
  isRemoteMode,
  judgeName,
  matchups,
  players,
  remotePlayback,
  scores,
  onPickWinner,
  onPlayPreview,
  onScheduleSyncedPreview,
}: OnlineJudgingPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.progressHeader}>
        <Text style={styles.sectionTitle}>Judging bracket</Text>
        {isMutating ? <ActivityIndicator color="#38BDF8" /> : null}
      </View>

      {activeMatchup ? (
        isJudge ? (
          <>
            <ActiveMatchupPanel
              isPickingWinner={isMutating || remotePlayback.isLocked}
              matchup={activeMatchup}
              showPreviewActions={!isRemoteMode}
              onPickWinner={onPickWinner}
              onPlayPreview={onPlayPreview}
            />
            {isRemoteMode ? (
              <RemotePlaybackControls
                isDisabled={isMutating || remotePlayback.isLocked}
                left={activeMatchup.left}
                right={activeMatchup.right}
                onSchedule={onScheduleSyncedPreview}
              />
            ) : null}
            <Text style={styles.audioStatus}>{audioStatus}</Text>
          </>
        ) : (
          <Text style={styles.body}>Waiting for {judgeName} to pick a winner.</Text>
        )
      ) : (
        <Text style={styles.body}>Preparing the next matchup...</Text>
      )}

      {isRemoteMode ? <RemotePlaybackPanel playback={remotePlayback} /> : null}
      <BracketProgress activeMatchupId={activeMatchup?.id} matchups={matchups} />
      <Scoreboard players={players} scores={scores} />
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
  panel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
