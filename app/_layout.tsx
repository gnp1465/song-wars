import { Stack } from "expo-router";
import { useEffect } from "react";
import { configurePreviewAudioMode } from "../src/services/audio/audioMode";

export default function RootLayout() {
  useEffect(() => {
    void configurePreviewAudioMode();
  }, []);

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: "#111827",
        },
        headerShown: false,
      }}
    />
  );
}
