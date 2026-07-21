import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeOnlineDisplayName } from "./displayName";

const LAST_DISPLAY_NAME_KEY = "song-wars:last-display-name";

export async function getLastDisplayName(): Promise<string> {
  return (await AsyncStorage.getItem(LAST_DISPLAY_NAME_KEY)) ?? "";
}

export async function saveLastDisplayName(displayName: string): Promise<void> {
  const trimmedDisplayName = normalizeOnlineDisplayName(displayName);

  if (!trimmedDisplayName) {
    return;
  }

  await AsyncStorage.setItem(LAST_DISPLAY_NAME_KEY, trimmedDisplayName);
}
