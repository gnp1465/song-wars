import type { Player } from "../types/game";
import type { MediaTrack } from "../types/media";

export const DEMO_TOPICS = ["Beach vibes", "Road trip", "Late night", "Main character"];

export const DEMO_PLAYERS: Player[] = [
  { id: "player-1", displayName: "Gus", isHost: true, isGuest: false },
  { id: "player-2", displayName: "Maya", isHost: false, isGuest: true },
  { id: "player-3", displayName: "Jay", isHost: false, isGuest: true },
  { id: "player-4", displayName: "Nina", isHost: false, isGuest: true },
];

export const DEMO_SONG_POOL: MediaTrack[] = [
  createDemoTrack("Espresso", "Sabrina Carpenter"),
  createDemoTrack("Blinding Lights", "The Weeknd"),
  createDemoTrack("Golden", "Harry Styles"),
  createDemoTrack("Levitating", "Dua Lipa"),
  createDemoTrack("Good Days", "SZA"),
  createDemoTrack("As It Was", "Harry Styles"),
];

export function createDemoTrack(title: string, artist: string): MediaTrack {
  return {
    id: `demo:${title}`,
    title,
    artists: [artist],
    providerRefs: [],
    capabilities: ["metadata_only"],
    resolutionStatus: "unresolved",
    attribution: [],
  };
}
