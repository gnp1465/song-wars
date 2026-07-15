import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_DISPLAY_NAME_KEY = "song-wars:last-display-name";

export async function getLastDisplayName(): Promise<string> {
  return (await AsyncStorage.getItem(LAST_DISPLAY_NAME_KEY)) ?? "";
}

export async function saveLastDisplayName(displayName: string): Promise<void> {
  const trimmedDisplayName = displayName.trim();

  if (!trimmedDisplayName) {
    return;
  }

  await AsyncStorage.setItem(LAST_DISPLAY_NAME_KEY, trimmedDisplayName);
}
