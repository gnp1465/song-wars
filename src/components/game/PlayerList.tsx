import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Player } from "../../types/game";

export interface PlayerListProps {
  players: Player[];
  minimumPlayersToStart: number;
  onRemoveGuest: (guestPlayerId: string) => void;
}

export function PlayerList({
  players,
  minimumPlayersToStart,
  onRemoveGuest,
}: PlayerListProps) {
  const guestCount = players.filter((player) => player.isGuest).length;
  const playersNeeded = Math.max(0, minimumPlayersToStart - players.length);
  const statusText =
    playersNeeded > 0
      ? `Need ${playersNeeded} more ${playersNeeded === 1 ? "player" : "players"} to start.`
      : "Ready to start.";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.countText}>{players.length}</Text>
      </View>

      {guestCount === 0 ? (
        <Text style={styles.emptyText}>No guests yet. Add at least two guests to start a battle.</Text>
      ) : null}

      <View style={styles.playerList}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.displayName}</Text>
            {player.isHost ? (
              <Text style={styles.playerRole}>Host</Text>
            ) : (
              <Pressable
                accessibilityHint={`Removes ${player.displayName} from the room.`}
                accessibilityLabel={`Remove ${player.displayName}`}
                accessibilityRole="button"
                style={styles.removeButton}
                onPress={() => onRemoveGuest(player.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <Text style={playersNeeded > 0 ? styles.waitingText : styles.readyText}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
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
  countText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "900",
  },
  emptyText: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  playerList: {
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
    minHeight: 38,
  },
  playerName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  playerRole: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "800",
  },
  removeButton: {
    alignItems: "center",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "800",
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
});
