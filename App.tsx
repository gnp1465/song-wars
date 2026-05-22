import { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { configurePreviewAudioMode } from "./src/services/audio/audioMode";
import { PreviewPlaybackScreen } from "./src/screens/PreviewPlaybackScreen";

export default function App() {
  useEffect(() => {
    void configurePreviewAudioMode();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <PreviewPlaybackScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111827",
  },
});
