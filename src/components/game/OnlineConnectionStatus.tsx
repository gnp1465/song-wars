import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OnlineRoomConnectionStatus } from "../../hooks/useOnlineRoom";

interface OnlineConnectionStatusProps {
  errorMessage?: string;
  lastSyncedAt?: number;
  onRetry?: () => void;
  status: OnlineRoomConnectionStatus;
}

export function OnlineConnectionStatus({
  errorMessage,
  lastSyncedAt,
  onRetry,
  status,
}: OnlineConnectionStatusProps) {
  if (status === "connected" || status === "idle") {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getConnectionStatusLabel(status)}</Text>
      <Text style={styles.detail}>
        {errorMessage ?? getConnectionStatusDetail(status, lastSyncedAt)}
      </Text>
      {status === "error" && onRetry ? (
        <Pressable
          accessibilityLabel="Retry online room connection"
          accessibilityRole="button"
          style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getConnectionStatusLabel(status: OnlineRoomConnectionStatus): string {
  if (status === "error") {
    return "Connection issue";
  }

  if (status === "reconnecting") {
    return "Reconnecting";
  }

  return "Loading room";
}

function getConnectionStatusDetail(
  status: OnlineRoomConnectionStatus,
  lastSyncedAt: number | undefined,
): string {
  if (status === "reconnecting") {
    return lastSyncedAt
      ? `Last synced ${Math.max(1, Math.round((Date.now() - lastSyncedAt) / 1000))}s ago.`
      : "Pulling the latest room state.";
  }

  return "Pulling the latest room state.";
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#172033",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detail: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#38BDF8",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryButtonText: {
    color: "#E0F2FE",
    fontSize: 14,
    fontWeight: "900",
  },
});
