import { Pressable, StyleSheet, Text, View } from "react-native";
import { getOnlineMemberPresenceLabel } from "../../services/online/onlineRoomPresence";
import type { OnlineRoomMember, OnlineRoomSnapshot } from "../../types/onlineRoom";

export interface OnlinePlayerListProps {
  currentMemberId?: string;
  isHost: boolean;
  isMutating: boolean;
  presenceHasSynced: boolean;
  snapshot: OnlineRoomSnapshot;
  onRemoveMember: (memberId: string) => void;
}

export function OnlinePlayerList({
  currentMemberId,
  isHost,
  isMutating,
  presenceHasSynced,
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
              {member.role === "host" ? "Host" : "Guest"} ·{" "}
              {getPresenceLabel(snapshot, member, currentMemberId, presenceHasSynced)}
            </Text>
          </View>
          {isHost && member.role === "guest" ? (
            <Pressable
              accessibilityLabel={`Remove ${member.displayName}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isMutating }}
              disabled={isMutating}
              style={[styles.removeButton, isMutating ? styles.disabledButton : undefined]}
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

function getPresenceLabel(
  snapshot: OnlineRoomSnapshot,
  member: OnlineRoomMember,
  currentMemberId: string | undefined,
  presenceHasSynced: boolean,
): string {
  return getOnlineMemberPresenceLabel(snapshot, member, {
    currentMemberId,
    presenceHasSynced,
  });
}

const styles = StyleSheet.create({
  countText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.45,
  },
  listHeader: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 38,
  },
  playerMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  playerName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  playerPanel: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playerRow: {
    alignItems: "center",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
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
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
