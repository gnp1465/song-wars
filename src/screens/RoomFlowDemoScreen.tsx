import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LocalBattleDemoScreen } from "./LocalBattleDemoScreen";
import type { Player } from "../types/game";

const DEMO_ROOM_CODE = "7392";

export function RoomFlowDemoScreen() {
  const [hostName, setHostName] = useState("Gus");
  const [guestName, setGuestName] = useState("");
  const [guestNames, setGuestNames] = useState(["Maya", "Jay", "Nina"]);
  const [hasCreatedRoom, setHasCreatedRoom] = useState(false);
  const [hasStartedGame, setHasStartedGame] = useState(false);

  const roomPlayers = useMemo(
    () => createRoomPlayers(hostName, guestNames),
    [guestNames, hostName],
  );
  const canStartGame = roomPlayers.length >= 3;

  function addGuest() {
    const nextGuestName = guestName.trim();

    if (!nextGuestName) {
      return;
    }

    setGuestNames((currentGuestNames) => [...currentGuestNames, nextGuestName]);
    setGuestName("");
  }

  if (hasStartedGame) {
    return <LocalBattleDemoScreen players={roomPlayers} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Room Demo</Text>
          <Text style={styles.title}>Create a room</Text>
          <Text style={styles.body}>
            This is a local fake room. It lets us test host and guest flow before adding a backend.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Host</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setHostName}
            placeholder="Host name"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={hostName}
          />
          <Pressable style={styles.primaryButton} onPress={() => setHasCreatedRoom(true)}>
            <Text style={styles.primaryButtonText}>Create Room</Text>
          </Pressable>
        </View>

        {hasCreatedRoom ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Room Code</Text>
            <Text style={styles.roomCode}>{DEMO_ROOM_CODE}</Text>
            <Text style={styles.body}>Guests join with a display name.</Text>

            <View style={styles.joinRow}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setGuestName}
                onSubmitEditing={addGuest}
                placeholder="Guest name"
                placeholderTextColor="#64748B"
                returnKeyType="done"
                style={styles.input}
                value={guestName}
              />
              <Pressable style={styles.addButton} onPress={addGuest}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.playerList}>
              {roomPlayers.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  <Text style={styles.playerName}>{player.displayName}</Text>
                  <Text style={styles.playerRole}>{player.isHost ? "Host" : "Guest"}</Text>
                </View>
              ))}
            </View>

            <Pressable
              disabled={!canStartGame}
              style={[styles.primaryButton, !canStartGame ? styles.disabledButton : undefined]}
              onPress={() => setHasStartedGame(true)}
            >
              <Text style={styles.primaryButtonText}>Start Game</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createRoomPlayers(hostName: string, guestNames: string[]): Player[] {
  const hostDisplayName = hostName.trim() || "Host";

  return [
    {
      id: "player-host",
      displayName: hostDisplayName,
      isHost: true,
      isGuest: false,
    },
    ...guestNames.map((displayName, index) => ({
      id: `player-guest-${index + 1}`,
      displayName,
      isHost: false,
      isGuest: true,
    })),
  ];
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  content: {
    gap: 18,
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
    gap: 14,
  },
  sectionTitle: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#082F49",
    fontSize: 16,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.45,
  },
  roomCode: {
    color: "#F9FAFB",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0,
  },
  joinRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 76,
  },
  addButtonText: {
    color: "#082F49",
    fontSize: 15,
    fontWeight: "900",
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
});
