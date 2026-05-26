import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { configurePreviewAudioMode } from "./src/services/audio/audioMode";
import { PreviewPlaybackScreen } from "./src/screens/PreviewPlaybackScreen";
import { RoomFlowDemoScreen } from "./src/screens/RoomFlowDemoScreen";

type DemoMode = "battle" | "preview";

export default function App() {
  const [mode, setMode] = useState<DemoMode>("battle");

  useEffect(() => {
    void configurePreviewAudioMode();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.nav}>
        <ModeButton isActive={mode === "battle"} label="Game" onPress={() => setMode("battle")} />
        <ModeButton isActive={mode === "preview"} label="Audio Lab" onPress={() => setMode("preview")} />
      </View>
      {mode === "battle" ? <RoomFlowDemoScreen /> : <PreviewPlaybackScreen />}
    </SafeAreaView>
  );
}

interface ModeButtonProps {
  isActive: boolean;
  label: string;
  onPress: () => void;
}

function ModeButton({ isActive, label, onPress }: ModeButtonProps) {
  return (
    <Pressable
      style={[styles.modeButton, isActive ? styles.activeModeButton : undefined]}
      onPress={onPress}
    >
      <Text style={[styles.modeButtonText, isActive ? styles.activeModeButtonText : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111827",
  },
  nav: {
    backgroundColor: "#0F172A",
    borderBottomColor: "#243244",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  modeButton: {
    alignItems: "center",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  activeModeButton: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  modeButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
    fontWeight: "800",
  },
  activeModeButtonText: {
    color: "#082F49",
  },
});
