import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  addGuestToRoom,
  canStartRoom,
  createLocalRoom,
  getRoomStatusLabel,
  hasDuplicateDisplayName,
  removeGuestFromRoom,
  startRoom,
  updatePointsToWin,
  updateRoomMode,
  updateSongsPerPlayer,
} from "../services/game/room";
import { PlayerList } from "../components/game/PlayerList";
import { RoomSettingsPanel } from "../components/game/RoomSettingsPanel";
import { TurnGuidance } from "../components/game/TurnGuidance";
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
  const playersNeeded = room ? Math.max(0, MINIMUM_PLAYERS_TO_START - room.players.length) : 0;
  const canAddGuest = Boolean(guestName.trim() && joinCodeInput.trim());

  function createRoom() {
    Keyboard.dismiss();
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

    Keyboard.dismiss();

    const normalizedJoinCode = joinCodeInput.trim();
    const nextGuestName = guestName.trim();

    if (!normalizedJoinCode) {
      setJoinError("Enter the room code.");
      return;
    }

    if (!nextGuestName) {
      setJoinError("Enter a guest name.");
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

  function updateJoinCodeInput(nextJoinCode: string) {
    setJoinCodeInput(nextJoinCode);
    setJoinError(undefined);
  }

  function updateGuestName(nextGuestName: string) {
    setGuestName(nextGuestName);
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

    Keyboard.dismiss();
    setRoom(startRoom(room));
  }

  function resetRoom() {
    setRoom(undefined);
    setHostName("Gus");
    setGuestName("");
    setJoinCodeInput("");
    setJoinError(undefined);
  }

  if (room?.status === "in_round") {
    return (
      <LocalBattleDemoScreen
        initialRoomMode={room.settings.mode}
        initialSongsPerPlayer={room.settings.songsPerPlayer}
        onResetRoom={resetRoom}
        players={room.players}
        pointsToWin={room.settings.pointsToWin}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
        style={styles.keyboardArea}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Song Wars</Text>
          <Text style={styles.title}>Create a room</Text>
          <Text style={styles.body}>
            Start a local battle, add guests, choose the rules, and run the bracket.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Host</Text>
          <TurnGuidance
            actorName={hostName.trim() || "Host"}
            detail={hasCreatedRoom ? "The host name is locked for this room." : "Hosts create rooms and choose the rules."}
            instruction={hasCreatedRoom ? "Invite guests with the room code." : "Enter the host name, then create the room."}
            phaseLabel="Host setup"
          />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            editable={!hasCreatedRoom}
            onChangeText={setHostName}
            onSubmitEditing={createRoom}
            placeholder="Host name"
            placeholderTextColor="#64748B"
            returnKeyType="done"
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
            <TurnGuidance
              actorName={roomPlayers.length === 1 ? "Waiting for guests" : `${roomPlayers.length} players joined`}
              detail={
                playersNeeded > 0
                  ? `Add ${playersNeeded} more ${playersNeeded === 1 ? "player" : "players"} to start.`
                  : "The room has enough players to start."
              }
              instruction="Add guests, confirm the rules, then start the game."
              phaseLabel="Lobby"
            />

            <RoomSettingsPanel
              mode={roomSettings.mode}
              pointsToWin={roomSettings.pointsToWin}
              songsPerPlayer={roomSettings.songsPerPlayer}
              onModeChange={(mode) => setRoom(updateRoomMode(room, mode))}
              onPointsToWinChange={(pointsToWin) =>
                setRoom(updatePointsToWin(room, pointsToWin))
              }
              onSongsPerPlayerChange={(songsPerPlayer) =>
                setRoom(updateSongsPerPlayer(room, songsPerPlayer))
              }
            />

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              onChangeText={updateJoinCodeInput}
              onSubmitEditing={addGuest}
              placeholder="Room code"
              placeholderTextColor="#64748B"
              returnKeyType="next"
              style={styles.input}
              value={joinCodeInput}
            />
            <View style={styles.joinRow}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={updateGuestName}
                onSubmitEditing={addGuest}
                placeholder="Guest name"
                placeholderTextColor="#64748B"
                returnKeyType="done"
                style={styles.input}
                value={guestName}
              />
              <Pressable
                disabled={!canAddGuest}
                style={[styles.addButton, !canAddGuest ? styles.disabledButton : undefined]}
                onPress={addGuest}
              >
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  keyboardArea: {
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
