import { router } from "expo-router";
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
import { RoomSettingsPanel } from "../../src/components/game/RoomSettingsPanel";
import { restoreOrCreateAnonymousSession } from "../../src/services/online/AuthSessionService";
import { createOnlineRoom } from "../../src/services/online/OnlineRoomService";
import { getLastDisplayName, saveLastDisplayName } from "../../src/services/online/displayNameStorage";
import { saveLastOnlineRoomId } from "../../src/services/online/onlineRoomResumeStorage";
import { getMissingSupabaseConfigMessage, getSupabaseConfig } from "../../src/services/supabase/config";
import type { RoomMode } from "../../src/types/game";

export default function CreateOnlineRoomScreen() {
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<RoomMode>("single_speaker");
  const [songsPerPlayer, setSongsPerPlayer] = useState(1);
  const [pointsToWin, setPointsToWin] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);
  const hasSupabaseConfig = Boolean(getSupabaseConfig());
  const canCreate = Boolean(displayName.trim()) && !isCreating && hasSupabaseConfig;

  useEffect(() => {
    void getLastDisplayName().then(setDisplayName);
  }, []);

  async function createRoom() {
    if (!canCreate) {
      return;
    }

    Keyboard.dismiss();
    setIsCreating(true);

    try {
      await restoreOrCreateAnonymousSession();
      const snapshot = await createOnlineRoom({
        displayName,
        mode,
        pointsToWin,
        songsPerPlayer,
      });

      await saveLastDisplayName(displayName);
      await saveLastOnlineRoomId(snapshot.room.id);
      router.replace(`/online/room/${snapshot.room.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create online room.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Online Room</Text>
          <Text style={styles.title}>Create a room</Text>
          <Text style={styles.body}>
            Create a six-digit room code and invite friends from separate phones.
          </Text>
        </View>

        {!hasSupabaseConfig ? (
          <Text style={styles.errorText}>{getMissingSupabaseConfigMessage()}</Text>
        ) : null}

        <TextInput
          accessibilityLabel="Host display name"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isCreating}
          onChangeText={(nextDisplayName) => {
            setDisplayName(nextDisplayName);
            setErrorMessage(undefined);
          }}
          onSubmitEditing={createRoom}
          placeholder="Your display name"
          placeholderTextColor="#64748B"
          returnKeyType="done"
          style={styles.input}
          value={displayName}
        />

        <RoomSettingsPanel
          disabled={isCreating}
          mode={mode}
          pointsToWin={pointsToWin}
          songsPerPlayer={songsPerPlayer}
          onModeChange={setMode}
          onPointsToWinChange={setPointsToWin}
          onSongsPerPlayerChange={setSongsPerPlayer}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityLabel="Create online room"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCreate }}
          disabled={!canCreate}
          style={[styles.primaryButton, !canCreate ? styles.disabledButton : undefined]}
          onPress={createRoom}
        >
          {isCreating ? (
            <ActivityIndicator color="#082F49" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Room</Text>
          )}
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
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
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
  disabledButton: {
    opacity: 0.45,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
