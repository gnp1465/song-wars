import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RoomSettingsPanel } from "../../../src/components/game/RoomSettingsPanel";
import { restoreOrCreateAnonymousSession } from "../../../src/services/online/AuthSessionService";
import { getOnlineRoomExitNotice } from "../../../src/services/online/onlineRoomAccess";
import { useOnlineRoom } from "../../../src/hooks/useOnlineRoom";
import type { OnlineRoomMember, OnlineRoomSnapshot } from "../../../src/types/onlineRoom";

const MINIMUM_PLAYERS_TO_START = 3;

export default function OnlineLobbyScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const snapshot = onlineRoom.snapshot;
  const currentMember = snapshot?.members.find((member) => member.userId === currentUserId);
  const isHost = currentMember?.role === "host";
  const playersNeeded = snapshot
    ? Math.max(0, MINIMUM_PLAYERS_TO_START - snapshot.members.length)
    : MINIMUM_PLAYERS_TO_START;
  const canStart =
    Boolean(snapshot && isHost && playersNeeded === 0 && snapshot.room.status === "lobby") &&
    !onlineRoom.isMutating;

  useEffect(() => {
    void restoreOrCreateAnonymousSession().then((session) => setCurrentUserId(session.userId));
  }, []);

  useEffect(() => {
    if (snapshot?.room.status === "in_round" && snapshot.currentRound) {
      router.replace(`/online/round/${snapshot.room.id}`);
    }
  }, [snapshot?.currentRound?.id, snapshot?.room.id, snapshot?.room.status]);

  useEffect(() => {
    const notice = getOnlineRoomExitNotice(snapshot, onlineRoom.errorMessage);

    if (notice) {
      router.replace({
        pathname: "/",
        params: {
          notice,
        },
      });
    }
  }, [onlineRoom.errorMessage, snapshot?.room.status]);

  async function leaveRoom() {
    if (!snapshot) {
      router.replace("/");
      return;
    }

    if (isHost) {
      await onlineRoom.closeRoom();
    } else {
      await onlineRoom.leaveRoom();
    }

    router.replace("/");
  }

  async function startRoom() {
    if (!canStart) {
      return;
    }

    await onlineRoom.startRoom();
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {onlineRoom.isLoading && !snapshot ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#38BDF8" />
            <Text style={styles.body}>Loading online room...</Text>
          </View>
        ) : null}

        {snapshot ? (
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Online Lobby</Text>
              <Text style={styles.title}>{snapshot.room.code ?? "Room started"}</Text>
              <Text style={styles.body}>
                Share this code. Players stay in the room if they briefly disconnect.
              </Text>
            </View>

            {onlineRoom.errorMessage ? (
              <Text style={styles.errorText}>{onlineRoom.errorMessage}</Text>
            ) : null}

            <OnlinePlayerList
              currentMemberId={currentMember?.id}
              isHost={isHost}
              snapshot={snapshot}
              onRemoveMember={(memberId) => void onlineRoom.removeMember(memberId)}
            />

            {isHost ? (
              <RoomSettingsPanel
                mode={snapshot.room.mode}
                pointsToWin={snapshot.room.pointsToWin}
                songsPerPlayer={snapshot.room.songsPerPlayer}
                onModeChange={(mode) => void onlineRoom.updateSettings({ mode })}
                onPointsToWinChange={(pointsToWin) =>
                  void onlineRoom.updateSettings({ pointsToWin })
                }
                onSongsPerPlayerChange={(songsPerPlayer) =>
                  void onlineRoom.updateSettings({ songsPerPlayer })
                }
              />
            ) : (
              <View style={styles.readOnlyPanel}>
                <Text style={styles.sectionTitle}>Room settings</Text>
                <Text style={styles.body}>{formatRoomSettings(snapshot)}</Text>
              </View>
            )}

            <Text style={playersNeeded > 0 ? styles.waitingText : styles.readyText}>
              {playersNeeded > 0
                ? `Need ${playersNeeded} more ${playersNeeded === 1 ? "player" : "players"} to start.`
                : "Ready to start."}
            </Text>

            {isHost ? (
              <Pressable
                accessibilityLabel="Start online game"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canStart }}
                disabled={!canStart}
                style={[styles.primaryButton, !canStart ? styles.disabledButton : undefined]}
                onPress={startRoom}
              >
                <Text style={styles.primaryButtonText}>
                  {onlineRoom.isMutating ? "Starting..." : "Start Game"}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.body}>Waiting for the host to start.</Text>
            )}

            <Pressable
              accessibilityLabel={isHost ? "Close online room" : "Leave online room"}
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={() => void leaveRoom()}
            >
              <Text style={styles.secondaryButtonText}>{isHost ? "Close Room" : "Leave Room"}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

interface OnlinePlayerListProps {
  currentMemberId?: string;
  isHost: boolean;
  snapshot: OnlineRoomSnapshot;
  onRemoveMember: (memberId: string) => void;
}

function OnlinePlayerList({
  currentMemberId,
  isHost,
  snapshot,
  onRemoveMember,
}: OnlinePlayerListProps) {
  return (
    <View style={styles.playerPanel}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.countText}>{snapshot.members.length}/12</Text>
      </View>
      {snapshot.members.map((member) => (
        <View key={member.id} style={styles.playerRow}>
          <View>
            <Text style={styles.playerName}>
              {member.displayName}
              {member.id === currentMemberId ? " (You)" : ""}
            </Text>
            <Text style={styles.playerMeta}>
              {member.role === "host" ? "Host" : "Guest"} · {getPresenceLabel(snapshot, member)}
            </Text>
          </View>
          {isHost && member.role === "guest" ? (
            <Pressable
              accessibilityLabel={`Remove ${member.displayName}`}
              accessibilityRole="button"
              style={styles.removeButton}
              onPress={() => onRemoveMember(member.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function getPresenceLabel(snapshot: OnlineRoomSnapshot, member: OnlineRoomMember): string {
  const presence = snapshot.presence.find((item) => item.memberId === member.id);

  return presence?.status === "online" ? "Online" : "Offline";
}

function formatRoomSettings(snapshot: OnlineRoomSnapshot): string {
  const modeLabel = snapshot.room.mode === "single_speaker" ? "Single Speaker" : "Remote Sync";

  return `${modeLabel} · ${snapshot.room.songsPerPlayer} song${
    snapshot.room.songsPerPlayer === 1 ? "" : "s"
  } each · First to ${snapshot.room.pointsToWin}`;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 24,
    paddingBottom: 48,
  },
  centerState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 48,
  },
  header: {
    gap: 8,
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
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0,
  },
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  playerPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listHeader: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 38,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  countText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "900",
  },
  playerRow: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
  },
  playerName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  playerMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  removeButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "800",
  },
  readOnlyPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  waitingText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
  readyText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "700",
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
  secondaryButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.45,
  },
});
