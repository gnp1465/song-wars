import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { resolvePlayablePreviewTrack } from "../services/media/previewResolution";
import { getDeviceStorefrontCode } from "../services/media/storefront";
import type { MediaTrack } from "../types/media";

export function usePreviewAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingPreviewRef = useRef(false);
  const previewRequestIdRef = useRef(0);
  const [audioStatus, setAudioStatus] = useState("No preview playing");

  useEffect(() => {
    return () => {
      cancelPreviewWork();
      void unloadCurrentSound();
    };
  }, []);

  async function playSongPreview(song: MediaTrack) {
    if (isLoadingPreviewRef.current) {
      return;
    }

    isLoadingPreviewRef.current = true;
    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;

    try {
      await unloadCurrentSound();
      setAudioStatus(`Loading ${song.title}...`);

      const resolvedTrack = await resolvePlayablePreviewTrack(
        song,
        song.storefrontCode ?? getDeviceStorefrontCode(),
      );
      const previewUrl = resolvedTrack.preview?.streamUrl;

      if (!previewUrl) {
        throw new Error("No playable preview found for this song.");
      }

      if (previewRequestIdRef.current !== requestId) {
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true },
      );

      if (previewRequestIdRef.current !== requestId) {
        await sound.stopAsync();
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      setAudioStatus(`Playing ${resolvedTrack.title}`);
    } catch (error) {
      if (previewRequestIdRef.current === requestId) {
        setAudioStatus(error instanceof Error ? error.message : "Preview playback failed.");
      }
    } finally {
      if (previewRequestIdRef.current === requestId) {
        isLoadingPreviewRef.current = false;
      }
    }
  }

  async function stopSongPreview(nextStatus = "Stopped") {
    cancelPreviewWork();
    await unloadCurrentSound();
    setAudioStatus(nextStatus);
  }

  function cancelPreviewWork() {
    previewRequestIdRef.current += 1;
    isLoadingPreviewRef.current = false;
  }

  async function unloadCurrentSound() {
    if (!soundRef.current) {
      return;
    }

    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
    soundRef.current = null;
  }

  return {
    audioStatus,
    playSongPreview,
    setAudioStatus,
    stopSongPreview,
  };
}
