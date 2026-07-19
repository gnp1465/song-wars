import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { restoreOrCreateAnonymousSession } from "../../../src/services/online/AuthSessionService";
import { getOnlineRoomExitNotice } from "../../../src/services/online/onlineRoomAccess";
import { useOnlineRoom } from "../../../src/hooks/useOnlineRoom";

export default function OnlineRoundSetupScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const snapshot = onlineRoom.snapshot;
  const currentMember = snapshot?.members.find((member) => member.userId === currentUserId);
  const judgeMember = snapshot?.members.find(
    (member) => member.id === snapshot.currentRound?.judgeMemberId,
  );
  const isJudge = Boolean(currentMember && judgeMember && currentMember.id === judgeMember.id);

  useEffect(() => {
    void restoreOrCreateAnonymousSession().then((session) => setCurrentUserId(session.userId));
  }, []);

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

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Round 1</Text>
          <Text style={styles.title}>Topic setup</Text>
          <Text style={styles.body}>
            Round 1 is ready. The judge sets the first prompt.
          </Text>
        </View>

        {onlineRoom.errorMessage ? (
          <Text style={styles.errorText}>{onlineRoom.errorMessage}</Text>
        ) : null}

        {snapshot ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Current judge</Text>
            <Text style={styles.judgeName}>{judgeMember?.displayName ?? "Waiting..."}</Text>
            <Text style={styles.body}>
              {isJudge
                ? "You are the judge for this round."
                : `Waiting for ${judgeMember?.displayName ?? "the judge"} to set the topic.`}
            </Text>
          </View>
        ) : (
          <Text style={styles.body}>Loading round setup...</Text>
        )}

        <Pressable
          accessibilityLabel="Back to home"
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
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
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
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
    gap: 8,
    padding: 14,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  judgeName: {
    color: "#F9FAFB",
    fontSize: 26,
    fontWeight: "900",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
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
});
