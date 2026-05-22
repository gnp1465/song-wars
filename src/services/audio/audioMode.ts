import { Audio } from "expo-av";

export interface ConfigureAudioModeOptions {
  playsInSilentModeIOS?: boolean;
  staysActiveInBackground?: boolean;
}

export async function configurePreviewAudioMode(
  options: ConfigureAudioModeOptions = {},
): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: options.playsInSilentModeIOS ?? true,
    staysActiveInBackground: options.staysActiveInBackground ?? false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}
