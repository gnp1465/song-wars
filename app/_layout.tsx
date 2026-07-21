import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppErrorBoundary } from "../src/components/system/AppErrorBoundary";
import { configurePreviewAudioMode } from "../src/services/audio/audioMode";

export default function RootLayout() {
  useEffect(() => {
    void configurePreviewAudioMode();
  }, []);

  return (
    <AppErrorBoundary>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: "#111827",
          },
          headerShown: false,
        }}
      />
    </AppErrorBoundary>
  );
}
