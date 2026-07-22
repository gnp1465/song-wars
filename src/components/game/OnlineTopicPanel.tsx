import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MAX_ONLINE_TOPIC_LENGTH } from "../../services/online/onlineRoundTopic";

export interface OnlineTopicPanelProps {
  canSubmitTopic: boolean;
  isJudge: boolean;
  isMutating: boolean;
  judgeName: string;
  normalizedTopicLength: number;
  onChangeTopic: (topic: string) => void;
  onSubmitTopic: () => void;
  presenceLabel?: string;
  presenceReady: boolean;
  roundStatus?: string;
  topic?: string;
  topicInput: string;
}

export function OnlineTopicPanel({
  canSubmitTopic,
  isJudge,
  isMutating,
  judgeName,
  normalizedTopicLength,
  onChangeTopic,
  onSubmitTopic,
  presenceLabel,
  presenceReady,
  roundStatus,
  topic,
  topicInput,
}: OnlineTopicPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.progressHeader}>
        <Text style={styles.sectionTitle}>Current judge</Text>
        {presenceLabel ? (
          <Text style={presenceReady ? styles.readyText : styles.waitingText}>
            {presenceLabel}
          </Text>
        ) : null}
      </View>
      <Text style={styles.judgeName}>{judgeName}</Text>

      {topic ? (
        <View style={styles.topicBox}>
          <Text style={styles.sectionTitle}>Topic</Text>
          <Text style={styles.topicText}>{topic}</Text>
        </View>
      ) : null}

      {roundStatus === "waiting_for_topic" ? (
        isJudge ? (
          <View style={styles.topicForm}>
            <TextInput
              accessibilityLabel="Round topic"
              autoCapitalize="sentences"
              autoCorrect
              editable={!isMutating}
              maxLength={MAX_ONLINE_TOPIC_LENGTH}
              onChangeText={onChangeTopic}
              onSubmitEditing={onSubmitTopic}
              placeholder="Beach vibes"
              placeholderTextColor="#64748B"
              returnKeyType="done"
              style={styles.input}
              value={topicInput}
            />
            <Text style={styles.helpText}>
              {normalizedTopicLength}/{MAX_ONLINE_TOPIC_LENGTH}
            </Text>
            <Pressable
              accessibilityLabel="Submit round topic"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmitTopic }}
              disabled={!canSubmitTopic}
              style={[styles.primaryButton, !canSubmitTopic ? styles.disabledButton : undefined]}
              onPress={onSubmitTopic}
            >
              {isMutating ? (
                <ActivityIndicator color="#082F49" />
              ) : (
                <Text style={styles.primaryButtonText}>Lock Topic</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Text style={styles.body}>Waiting for {judgeName} to set the topic.</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#CBD5E1",
    fontSize: 16,
    lineHeight: 23,
  },
  disabledButton: {
    opacity: 0.45,
  },
  helpText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
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
  judgeName: {
    color: "#F9FAFB",
    fontSize: 26,
    fontWeight: "900",
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
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  readyText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topicBox: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  topicForm: {
    gap: 10,
  },
  topicText: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  waitingText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "800",
  },
});
