import type { MediaProvider, MediaSearchOptions } from "../MediaProvider";
import type {
  MediaAttribution,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaSearchResult,
  MediaTrack,
} from "../../../types/media";

const MOCK_SPOTIFY_CATALOG = [
  { id: "espresso", title: "Espresso", artists: ["Sabrina Carpenter"] },
  { id: "blinding-lights", title: "Blinding Lights", artists: ["The Weeknd"] },
  { id: "golden", title: "Golden", artists: ["Harry Styles"] },
  { id: "levitating", title: "Levitating", artists: ["Dua Lipa"] },
  { id: "good-days", title: "Good Days", artists: ["SZA"] },
  { id: "as-it-was", title: "As It Was", artists: ["Harry Styles"] },
];

export class MockSpotifyProvider implements MediaProvider {
  readonly id = "spotify";
  readonly name = "Spotify";

  async searchTracks(options: MediaSearchOptions): Promise<MediaSearchResult[]> {
    const normalizedQuery = options.query.toLowerCase().trim();
    const matches = MOCK_SPOTIFY_CATALOG.filter((track) =>
      `${track.title} ${track.artists.join(" ")}`.toLowerCase().includes(normalizedQuery),
    ).slice(0, options.limit ?? 10);

    return matches.map((track) => ({
      sourceProviderId: "spotify",
      track: this.toMediaTrack(track, options.storefrontCode),
    }));
  }

  async resolvePreview(request: MediaResolutionRequest): Promise<MediaResolutionResult> {
    return {
      track: {
        ...request.sourceTrack,
        storefrontCode: request.storefrontCode,
        resolutionStatus: "preview_unavailable",
      },
      resolvedProviderId: "spotify",
      status: "preview_unavailable",
      reason: "Mock Spotify is search-only and does not provide preview streams.",
    };
  }

  canStreamInApp(): boolean {
    return false;
  }

  supportsCapability(track: MediaTrack, capability: MediaTrack["capabilities"][number]): boolean {
    return track.capabilities.includes(capability);
  }

  getAttribution(): MediaAttribution {
    return {
      providerId: "spotify",
      providerName: "Spotify",
    };
  }

  openExternalUrl(track: MediaTrack): string | undefined {
    return track.providerRefs.find((ref) => ref.providerId === "spotify")?.url;
  }

  private toMediaTrack(
    track: (typeof MOCK_SPOTIFY_CATALOG)[number],
    storefrontCode: string,
  ): MediaTrack {
    return {
      id: `spotify:track:${track.id}`,
      title: track.title,
      artists: track.artists,
      storefrontCode,
      providerRefs: [
        {
          providerId: "spotify",
          providerTrackId: track.id,
          url: `https://open.spotify.com/track/${track.id}`,
        },
      ],
      capabilities: ["metadata_only", "external_link"],
      resolutionStatus: "unresolved",
      attribution: [this.getAttribution()],
    };
  }
}
