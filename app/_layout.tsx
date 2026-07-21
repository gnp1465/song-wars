import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppErrorBoundary } from "../src/components/system/AppErrorBoundary";
import { configurePreviewAudioMode } from "../src/services/audio/audioMode";
import { reportAppError, reportAppEvent } from "../src/services/diagnostics/logger";

export default function RootLayout() {
  useEffect(() => {
    reportAppEvent("app_started", {
      area: "app",
      metadata: {
        platform: "expo-router",
      },
    });

    void configurePreviewAudioMode()
      .then(() => {
        reportAppEvent("audio_mode_configured", {
          area: "audio-mode",
        });
      })
      .catch((error) => {
        reportAppError(error, {
          area: "audio-mode",
          detail: "Failed to configure global preview audio mode.",
        });
      });
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
