import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { OnlineConnectionStatus } from "../../../src/components/game/OnlineConnectionStatus";
import { OnlinePlayerList } from "../../../src/components/game/OnlinePlayerList";
import { RoomSettingsPanel } from "../../../src/components/game/RoomSettingsPanel";
import { clearPreviewCache } from "../../../src/services/audio/previewCache";
import { restoreOrCreateAnonymousSession } from "../../../src/services/online/AuthSessionService";
import { getOnlineRoomExpiryLabel } from "../../../src/services/online/onlineRoomExpiry";
import { getOnlineRoomExitNotice } from "../../../src/services/online/onlineRoomAccess";
import { clearLastOnlineRoomId } from "../../../src/services/online/onlineRoomResumeStorage";
import { useOnlineRoom } from "../../../src/hooks/useOnlineRoom";
import type { OnlineRoomSnapshot } from "../../../src/types/onlineRoom";

const MINIMUM_PLAYERS_TO_START = 3;

export default function OnlineLobbyScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const snapshot = onlineRoom.snapshot;
  const joinUrl = snapshot?.room.code
    ? Linking.createURL("/online/join", {
        queryParams: {
          code: snapshot.room.code,
        },
      })
    : undefined;
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
      void clearLastOnlineRoomId();
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

    const didExit = isHost ? await onlineRoom.closeRoom() : await onlineRoom.leaveRoom();

    if (!didExit) {
      return;
    }

    await clearLastOnlineRoomId();
    await clearPreviewCache();
    router.replace("/");
  }

  function confirmLeaveRoom() {
    if (!snapshot || onlineRoom.isMutating) {
      return;
    }

    Alert.alert(
      isHost ? "Close online room?" : "Leave online room?",
      isHost
        ? "This closes the lobby for everyone and returns players Home."
        : "You will leave this room and return Home.",
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          onPress: () => void leaveRoom(),
          style: isHost ? "destructive" : "default",
          text: isHost ? "Close Room" : "Leave Room",
        },
      ],
    );
  }

  async function startRoom() {
    if (!canStart) {
      return;
    }

    await onlineRoom.startRoom();
  }

  async function shareInvite() {
    if (!snapshot?.room.code || !joinUrl) {
      return;
    }

    await Share.share({
      message: `Join my Song Wars room with code ${snapshot.room.code}: ${joinUrl}`,
      title: "Join my Song Wars room",
      url: joinUrl,
    });
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
              <Text style={styles.expiryText}>{getOnlineRoomExpiryLabel(snapshot.room)}</Text>
            </View>

            <OnlineConnectionStatus
              errorMessage={onlineRoom.errorMessage}
              lastSyncedAt={onlineRoom.lastSyncedAt}
              onRetry={() => void onlineRoom.refresh()}
              status={onlineRoom.connectionStatus}
            />

            {joinUrl && snapshot.room.code ? (
              <View style={styles.invitePanel}>
                <View>
                  <Text style={styles.sectionTitle}>Quick join</Text>
                  <Text style={styles.body}>Scan to open this room code.</Text>
                </View>
                <View style={styles.qrFrame}>
                  <QRCode
                    backgroundColor="#F9FAFB"
                    color="#111827"
                    size={168}
                    value={joinUrl}
                  />
                </View>
                <Text selectable style={styles.joinLink}>
                  {joinUrl}
                </Text>
                <Pressable
                  accessibilityLabel="Share online room invite"
                  accessibilityRole="button"
                  style={styles.shareButton}
                  onPress={() => void shareInvite()}
                >
                  <Text style={styles.shareButtonText}>Share Invite</Text>
                </Pressable>
              </View>
            ) : null}

            {onlineRoom.errorMessage && onlineRoom.connectionStatus !== "error" ? (
              <Text style={styles.errorText}>{onlineRoom.errorMessage}</Text>
            ) : null}

            <OnlinePlayerList
              currentMemberId={currentMember?.id}
              isHost={isHost}
              isMutating={onlineRoom.isMutating}
              snapshot={snapshot}
              onRemoveMember={(memberId) => void onlineRoom.removeMember(memberId)}
            />

            {isHost ? (
              <RoomSettingsPanel
                disabled={onlineRoom.isMutating}
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
              accessibilityState={{ disabled: onlineRoom.isMutating }}
              disabled={onlineRoom.isMutating}
              style={[
                styles.secondaryButton,
                onlineRoom.isMutating ? styles.disabledButton : undefined,
              ]}
              onPress={confirmLeaveRoom}
            >
              <Text style={styles.secondaryButtonText}>{isHost ? "Close Room" : "Leave Room"}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
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
  expiryText: {
    color: "#7DD3FC",
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  readOnlyPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  invitePanel: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  qrFrame: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
  },
  joinLink: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  shareButton: {
    alignItems: "center",
    borderColor: "#38BDF8",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16,
    width: "100%",
  },
  shareButtonText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "900",
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
