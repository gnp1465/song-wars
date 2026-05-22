import { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { configurePreviewAudioMode } from "./src/services/audio/audioMode";
import { LocalBattleDemoScreen } from "./src/screens/LocalBattleDemoScreen";

export default function App() {
  useEffect(() => {
    void configurePreviewAudioMode();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <LocalBattleDemoScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111827",
  },
});
