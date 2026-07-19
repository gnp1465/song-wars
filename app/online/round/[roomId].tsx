import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { restoreOrCreateAnonymousSession } from "../../../src/services/online/AuthSessionService";
import { getOnlineRoomExitNotice } from "../../../src/services/online/onlineRoomAccess";
import {
  canSubmitOnlineTopic,
  MAX_ONLINE_TOPIC_LENGTH,
  normalizeOnlineTopic,
} from "../../../src/services/online/onlineRoundTopic";
import { useOnlineRoom } from "../../../src/hooks/useOnlineRoom";

export default function OnlineRoundSetupScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [topicInput, setTopicInput] = useState("");
  const onlineRoom = useOnlineRoom(roomId, currentUserId);
  const snapshot = onlineRoom.snapshot;
  const currentRound = snapshot?.currentRound;
  const currentMember = snapshot?.members.find((member) => member.userId === currentUserId);
  const judgeMember = snapshot?.members.find((member) => member.id === currentRound?.judgeMemberId);
  const isJudge = Boolean(currentMember && judgeMember && currentMember.id === judgeMember.id);
  const canSubmitTopic = canSubmitOnlineTopic({
    currentMemberId: currentMember?.id,
    isMutating: onlineRoom.isMutating,
    judgeMemberId: judgeMember?.id,
    roundStatus: currentRound?.status,
    topicInput,
  });
  const normalizedTopic = normalizeOnlineTopic(topicInput);

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

  async function submitTopic() {
    if (!canSubmitTopic) {
      return;
    }

    Keyboard.dismiss();
    await onlineRoom.submitTopic(normalizedTopic);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Round {currentRound?.roundNumber ?? 1}</Text>
          <Text style={styles.title}>
            {currentRound?.status === "submitting" ? "Submissions" : "Topic setup"}
          </Text>
          <Text style={styles.body}>
            {currentRound?.status === "submitting"
              ? "The topic is locked. Song submissions are next."
              : "The judge sets the prompt for this round."}
          </Text>
        </View>

        {onlineRoom.errorMessage ? (
          <Text style={styles.errorText}>{onlineRoom.errorMessage}</Text>
        ) : null}

        {snapshot ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Current judge</Text>
            <Text style={styles.judgeName}>{judgeMember?.displayName ?? "Waiting..."}</Text>
            {currentRound?.topic ? (
              <View style={styles.topicBox}>
                <Text style={styles.sectionTitle}>Topic</Text>
                <Text style={styles.topicText}>{currentRound.topic}</Text>
              </View>
            ) : null}
            {currentRound?.status === "waiting_for_topic" ? (
              isJudge ? (
                <View style={styles.topicForm}>
                  <TextInput
                    accessibilityLabel="Round topic"
                    autoCapitalize="sentences"
                    autoCorrect
                    editable={!onlineRoom.isMutating}
                    maxLength={MAX_ONLINE_TOPIC_LENGTH}
                    onChangeText={(nextTopic) => {
                      setTopicInput(nextTopic);
                      onlineRoom.clearError();
                    }}
                    onSubmitEditing={submitTopic}
                    placeholder="Beach vibes"
                    placeholderTextColor="#64748B"
                    returnKeyType="done"
                    style={styles.input}
                    value={topicInput}
                  />
                  <Text style={styles.helpText}>
                    {normalizedTopic.length}/{MAX_ONLINE_TOPIC_LENGTH}
                  </Text>
                  <Pressable
                    accessibilityLabel="Submit round topic"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSubmitTopic }}
                    disabled={!canSubmitTopic}
                    style={[
                      styles.primaryButton,
                      !canSubmitTopic ? styles.disabledButton : undefined,
                    ]}
                    onPress={submitTopic}
                  >
                    {onlineRoom.isMutating ? (
                      <ActivityIndicator color="#082F49" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Lock Topic</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.body}>
                  Waiting for {judgeMember?.displayName ?? "the judge"} to set the topic.
                </Text>
              )
            ) : (
              <Text style={styles.body}>
                {isJudge
                  ? "Topic locked. Contestants will submit songs next."
                  : "Get ready to submit songs for this topic."}
              </Text>
            )}
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
  topicForm: {
    gap: 10,
  },
  topicBox: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
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
  topicText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
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
  helpText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
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
