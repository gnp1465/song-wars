import { Audio } from "expo-av";
import { useRef, useState } from "react";
import { MediaResolutionService } from "../services/media/MediaResolutionService";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import type { MediaTrack } from "../types/media";

export function usePreviewAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingPreviewRef = useRef(false);
  const [audioStatus, setAudioStatus] = useState("No preview playing");

  async function playSongPreview(song: MediaTrack) {
    if (isLoadingPreviewRef.current) {
      return;
    }

    isLoadingPreviewRef.current = true;
    setAudioStatus(`Loading ${song.title}...`);

    try {
      await stopSongPreview();

      const service = new MediaResolutionService({
        providers: [new AppleITunesProvider()],
      });
      const result = await service.resolveTrackPreview({
        sourceTrack: song,
        storefrontCode: "US",
        preferredProviderIds: ["apple_itunes"],
      });

      if (!result.track.preview?.streamUrl) {
        throw new Error(result.reason ?? "No preview found.");
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: result.track.preview.streamUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setAudioStatus(`Playing ${result.track.title}`);
    } catch (error) {
      setAudioStatus(error instanceof Error ? error.message : "Preview playback failed.");
    } finally {
      isLoadingPreviewRef.current = false;
    }
  }

  async function stopSongPreview() {
    if (!soundRef.current) {
      return;
    }

    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
    soundRef.current = null;
    setAudioStatus("Stopped");
  }

  return {
    audioStatus,
    playSongPreview,
    setAudioStatus,
    stopSongPreview,
  };
}
