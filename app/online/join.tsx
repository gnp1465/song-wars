import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { restoreOrCreateAnonymousSession } from "../../src/services/online/AuthSessionService";
import { joinOnlineRoom } from "../../src/services/online/OnlineRoomService";
import {
  getOnlineDisplayNameValidationMessage,
  isValidOnlineDisplayName,
  MAX_ONLINE_DISPLAY_NAME_LENGTH,
  normalizeOnlineDisplayName,
} from "../../src/services/online/displayName";
import { reportAppError, reportAppEvent } from "../../src/services/diagnostics/logger";
import { getLastDisplayName, saveLastDisplayName } from "../../src/services/online/displayNameStorage";
import {
  getOnlineRoomCodeValidationMessage,
  isValidOnlineRoomCode,
  normalizeOnlineRoomCode,
  ONLINE_ROOM_CODE_LENGTH,
} from "../../src/services/online/onlineRoomCode";
import { saveLastOnlineRoomId } from "../../src/services/online/onlineRoomResumeStorage";
import { getMissingSupabaseConfigMessage, getSupabaseConfig } from "../../src/services/supabase/config";

type InputHandle = InstanceType<typeof TextInput>;

export default function JoinOnlineRoomScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const displayNameInputRef = useRef<InputHandle>(null);
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isJoining, setIsJoining] = useState(false);
  const hasSupabaseConfig = Boolean(getSupabaseConfig());
  const normalizedRoomCode = normalizeOnlineRoomCode(roomCode);
  const displayNameValidationMessage = getOnlineDisplayNameValidationMessage(displayName);
  const roomCodeValidationMessage = getOnlineRoomCodeValidationMessage(roomCode);
  const canJoin =
    isValidOnlineDisplayName(displayName) &&
    isValidOnlineRoomCode(roomCode) &&
    !isJoining &&
    hasSupabaseConfig;

  useEffect(() => {
    void getLastDisplayName().then(setDisplayName);
  }, []);

  useEffect(() => {
    if (typeof params.code === "string") {
      setRoomCode(normalizeOnlineRoomCode(params.code));
      setErrorMessage(undefined);
    }
  }, [params.code]);

  async function joinRoom() {
    if (!canJoin) {
      return;
    }

    Keyboard.dismiss();
    setIsJoining(true);
    const normalizedDisplayName = normalizeOnlineDisplayName(displayName);

    try {
      await restoreOrCreateAnonymousSession();
      const snapshot = await joinOnlineRoom({
        code: normalizedRoomCode,
        displayName: normalizedDisplayName,
      });

      await saveLastDisplayName(normalizedDisplayName);
      await saveLastOnlineRoomId(snapshot.room.id);
      reportAppEvent("online_room_action_succeeded", {
        area: "online-room-join",
        metadata: {
          usedDeepLinkCode: typeof params.code === "string",
        },
      });
      router.replace(`/online/room/${snapshot.room.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not join online room.");
      reportAppError(error, {
        area: "online-room-join",
        detail: "Failed to join an online room.",
        metadata: {
          usedDeepLinkCode: typeof params.code === "string",
        },
      });
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Online Room</Text>
            <Text style={styles.title}>Join a room</Text>
            <Text style={styles.body}>Enter the six-digit room code and a temporary display name.</Text>
          </View>

          {!hasSupabaseConfig ? (
            <Text style={styles.errorText}>{getMissingSupabaseConfigMessage()}</Text>
          ) : null}

          <TextInput
            accessibilityLabel="Room code"
            editable={!isJoining}
            keyboardType="number-pad"
            maxLength={ONLINE_ROOM_CODE_LENGTH}
            onChangeText={(nextCode) => {
              setRoomCode(normalizeOnlineRoomCode(nextCode));
              setErrorMessage(undefined);
            }}
            onSubmitEditing={() => displayNameInputRef.current?.focus()}
            placeholder="Room code"
            placeholderTextColor="#64748B"
            returnKeyType="next"
            style={styles.input}
            value={normalizedRoomCode}
          />
          {roomCodeValidationMessage && roomCode.length > 0 ? (
            <Text style={styles.errorText}>{roomCodeValidationMessage}</Text>
          ) : null}
          <TextInput
            ref={displayNameInputRef}
            accessibilityLabel="Display name"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isJoining}
            maxLength={MAX_ONLINE_DISPLAY_NAME_LENGTH + 1}
            onChangeText={(nextDisplayName) => {
              setDisplayName(nextDisplayName);
              setErrorMessage(undefined);
            }}
            onSubmitEditing={joinRoom}
            placeholder="Your display name"
            placeholderTextColor="#64748B"
            returnKeyType="done"
            style={styles.input}
            value={displayName}
          />
          {displayNameValidationMessage && displayName.length > 0 ? (
            <Text style={styles.errorText}>{displayNameValidationMessage}</Text>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            accessibilityLabel="Join online room"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canJoin }}
            disabled={!canJoin}
            style={[styles.primaryButton, !canJoin ? styles.disabledButton : undefined]}
            onPress={joinRoom}
          >
            {isJoining ? (
              <ActivityIndicator color="#082F49" />
            ) : (
              <Text style={styles.primaryButtonText}>Join Room</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="Back to home"
            accessibilityRole="button"
            accessibilityState={{ disabled: isJoining }}
            disabled={isJoining}
            style={[styles.secondaryButton, isJoining ? styles.disabledButton : undefined]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </Pressable>
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
  keyboardView: {
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
  secondaryButton: {
    alignItems: "center",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
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
