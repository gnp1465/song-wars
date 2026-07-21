import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_ONLINE_ROOM_ID_KEY = "song-wars:last-online-room-id";

export async function getLastOnlineRoomId(): Promise<string | undefined> {
  const roomId = await AsyncStorage.getItem(LAST_ONLINE_ROOM_ID_KEY);

  return roomId ?? undefined;
}

export async function saveLastOnlineRoomId(roomId: string): Promise<void> {
  await AsyncStorage.setItem(LAST_ONLINE_ROOM_ID_KEY, roomId);
}

export async function clearLastOnlineRoomId(): Promise<void> {
  await AsyncStorage.removeItem(LAST_ONLINE_ROOM_ID_KEY);
}
