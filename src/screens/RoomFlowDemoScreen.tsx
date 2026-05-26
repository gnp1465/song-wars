import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  addGuestToRoom,
  canStartRoom,
  createLocalRoom,
  getRoomStatusLabel,
  hasDuplicateDisplayName,
  removeGuestFromRoom,
  startRoom,
  updateRoomMode,
  updateSongsPerPlayer,
} from "../services/game/room";
import { PlayerList } from "../components/game/PlayerList";
import { RoomSettingsPanel } from "../components/game/RoomSettingsPanel";
import { LocalBattleDemoScreen } from "./LocalBattleDemoScreen";
import type { Room } from "../types/game";

const DEMO_ROOM_CODE = "7392";
const MINIMUM_PLAYERS_TO_START = 3;

export function RoomFlowDemoScreen() {
  const [hostName, setHostName] = useState("Gus");
  const [guestName, setGuestName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | undefined>();
  const [room, setRoom] = useState<Room | undefined>();

  const roomPlayers = room?.players ?? [];
  const roomSettings = room?.settings;
  const hasCreatedRoom = Boolean(room);
  const canStartGame = room ? canStartRoom(room) : false;

  function createRoom() {
    setRoom(
      createLocalRoom({
        hostName,
        roomCode: DEMO_ROOM_CODE,
        roomId: "room-demo",
      }),
    );
  }

  function addGuest() {
    if (!room) {
      return;
    }

    const normalizedJoinCode = joinCodeInput.trim();
    const nextGuestName = guestName.trim();

    if (!nextGuestName) {
      return;
    }

    if (normalizedJoinCode !== DEMO_ROOM_CODE) {
      setJoinError("Room code does not match.");
      return;
    }

    if (hasDuplicateDisplayName(room, nextGuestName)) {
      setJoinError("A player with that name is already in the room.");
      return;
    }

    setRoom(addGuestToRoom(room, { displayName: nextGuestName }));
    setGuestName("");
    setJoinCodeInput("");
    setJoinError(undefined);
  }

  function removeGuest(guestPlayerId: string) {
    if (!room) {
      return;
    }

    setRoom(removeGuestFromRoom(room, guestPlayerId));
  }

  function handleStartGame() {
    if (!room) {
      return;
    }

    setRoom(startRoom(room));
  }

  if (room?.status === "in_round") {
    return (
      <LocalBattleDemoScreen
        initialRoomMode={room.settings.mode}
        initialSongsPerPlayer={room.settings.songsPerPlayer}
        players={room.players}
      />
    );
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
            editable={!hasCreatedRoom}
            onChangeText={setHostName}
            placeholder="Host name"
            placeholderTextColor="#64748B"
            style={[styles.input, hasCreatedRoom ? styles.lockedInput : undefined]}
            value={hostName}
          />
          {hasCreatedRoom ? (
            <Text style={styles.body}>Host name is locked after room creation.</Text>
          ) : (
            <Pressable style={styles.primaryButton} onPress={createRoom}>
              <Text style={styles.primaryButtonText}>Create Room</Text>
            </Pressable>
          )}
        </View>

        {room && roomSettings ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Room Code</Text>
            <View style={styles.roomSummaryRow}>
              <Text style={styles.roomCode}>{room.code}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{getRoomStatusLabel(room.status)}</Text>
              </View>
            </View>
            <Text style={styles.body}>Guests join with a display name.</Text>

            <RoomSettingsPanel
              mode={roomSettings.mode}
              songsPerPlayer={roomSettings.songsPerPlayer}
              onModeChange={(mode) => setRoom(updateRoomMode(room, mode))}
              onSongsPerPlayerChange={(songsPerPlayer) =>
                setRoom(updateSongsPerPlayer(room, songsPerPlayer))
              }
            />

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              onChangeText={setJoinCodeInput}
              placeholder="Room code"
              placeholderTextColor="#64748B"
              style={styles.input}
              value={joinCodeInput}
            />
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
            {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}

            <PlayerList
              minimumPlayersToStart={MINIMUM_PLAYERS_TO_START}
              players={roomPlayers}
              onRemoveGuest={removeGuest}
            />

            <Pressable
              disabled={!canStartGame}
              style={[styles.primaryButton, !canStartGame ? styles.disabledButton : undefined]}
              onPress={handleStartGame}
            >
              <Text style={styles.primaryButtonText}>Start Game</Text>
            </Pressable>
          </View>
        ) : null}
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
  lockedInput: {
    opacity: 0.65,
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
  roomSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    color: "#ECFEFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
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
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
});
