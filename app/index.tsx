import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { restoreOrCreateAnonymousSession } from "../src/services/online/AuthSessionService";
import { fetchOnlineRoomSnapshot } from "../src/services/online/OnlineRoomService";
import { getOnlineRoomResumeRoute } from "../src/services/online/onlineRoomResume";
import {
  clearLastOnlineRoomId,
  getLastOnlineRoomId,
} from "../src/services/online/onlineRoomResumeStorage";
import { getSupabaseConfig } from "../src/services/supabase/config";

interface ResumeRoomState {
  isChecking: boolean;
  roomId?: string;
  route?: "lobby" | "round";
}

export default function HomeScreen() {
  const params = useLocalSearchParams<{ notice?: string }>();
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const [resumeRoom, setResumeRoom] = useState<ResumeRoomState>({ isChecking: true });
  const hasSupabaseConfig = Boolean(getSupabaseConfig());

  const checkResumeRoom = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setResumeRoom({ isChecking: false });
      return;
    }

    const roomId = await getLastOnlineRoomId();

    if (!roomId) {
      setResumeRoom({ isChecking: false });
      return;
    }

    try {
      const session = await restoreOrCreateAnonymousSession();
      const snapshot = await fetchOnlineRoomSnapshot(roomId);
      const route = getOnlineRoomResumeRoute(snapshot, session.userId);

      if (!route) {
        await clearLastOnlineRoomId();
        setResumeRoom({ isChecking: false });
        return;
      }

      setResumeRoom({
        isChecking: false,
        roomId,
        route,
      });
    } catch {
      await clearLastOnlineRoomId();
      setResumeRoom({ isChecking: false });
    }
  }, [hasSupabaseConfig]);

  useEffect(() => {
    void checkResumeRoom();
  }, [checkResumeRoom]);

  function resumeOnlineRoom() {
    if (!resumeRoom.roomId || !resumeRoom.route) {
      return;
    }

    router.push(
      resumeRoom.route === "lobby"
        ? `/online/room/${resumeRoom.roomId}`
        : `/online/round/${resumeRoom.roomId}`,
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Song Wars</Text>
          <Text style={styles.title}>Choose your room</Text>
          <Text style={styles.body}>
            Play the finished local prototype or start a real online lobby across phones.
          </Text>
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        <View style={styles.actions}>
          {resumeRoom.isChecking ? (
            <View style={styles.resumeStatus}>
              <ActivityIndicator color="#38BDF8" />
              <Text style={styles.resumeText}>Checking for an active online room...</Text>
            </View>
          ) : null}
          {resumeRoom.roomId ? (
            <HomeButton
              label="Resume Online Room"
              detail="Return to the last room from this phone."
              onPress={resumeOnlineRoom}
            />
          ) : null}
          <HomeButton
            label="Create Online Room"
            detail="Host a six-digit room with anonymous sessions."
            onPress={() => router.push("/online/create")}
          />
          <HomeButton
            label="Join Online Room"
            detail="Enter a code and join from another phone."
            onPress={() => router.push("/online/join")}
          />
          <HomeButton
            label="Local Game"
            detail="Keep playing the completed offline prototype."
            onPress={() => router.push("/local")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface HomeButtonProps {
  detail: string;
  label: string;
  onPress: () => void;
}

function HomeButton({ detail, label, onPress }: HomeButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={styles.actionButton}
      onPress={onPress}
    >
      <Text style={styles.actionTitle}>{label}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#111827",
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 24,
    justifyContent: "center",
    padding: 24,
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
  noticeText: {
    backgroundColor: "#1F2937",
    borderColor: "#475569",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 12,
  },
  actions: {
    gap: 12,
  },
  resumeStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 36,
  },
  resumeText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: "#1F2937",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
    padding: 16,
  },
  actionTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "900",
  },
  actionDetail: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
});
