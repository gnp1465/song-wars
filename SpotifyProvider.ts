import type { MediaProvider, MediaSearchOptions } from "../MediaProvider";
import type {
  MediaAttribution,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaSearchResult,
  MediaTrack,
} from "../../../types/media";

interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrackResult[];
  };
}

interface SpotifyTrackResult {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album?: {
    name?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
  };
  duration_ms?: number;
  explicit?: boolean;
  external_ids?: {
    isrc?: string;
  };
  external_urls?: {
    spotify?: string;
  };
}

export interface SpotifyProviderOptions {
  accessToken: string;
  fetcher?: typeof fetch;
}

export class SpotifyProvider implements MediaProvider {
  readonly id = "spotify";
  readonly name = "Spotify";

  private readonly accessToken: string;
  private readonly fetcher: typeof fetch;

  constructor(options: SpotifyProviderOptions) {
    this.accessToken = options.accessToken;
    this.fetcher = options.fetcher ?? fetch;
  }

  async searchTracks(options: MediaSearchOptions): Promise<MediaSearchResult[]> {
    const params = new URLSearchParams({
      q: options.query,
      type: "track",
      market: options.storefrontCode,
      limit: String(options.limit ?? 10),
    });

    const response = await this.fetcher(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify search failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as SpotifySearchResponse;

    return (payload.tracks?.items ?? []).map((result) => ({
      sourceProviderId: "spotify",
      track: this.mapSpotifyTrack(result, options.storefrontCode),
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
      reason: "Spotify is used for search and metadata, not guaranteed in-app preview delivery.",
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

  private mapSpotifyTrack(result: SpotifyTrackResult, storefrontCode: string): MediaTrack {
    const artwork = result.album?.images?.[0];

    return {
      id: `spotify:${result.id}`,
      title: result.name,
      artists: result.artists.map((artist) => artist.name),
      albumName: result.album?.name,
      artwork: artwork
        ? {
            url: artwork.url,
            width: artwork.width,
            height: artwork.height,
          }
        : undefined,
      durationMs: result.duration_ms,
      isrc: result.external_ids?.isrc,
      explicit: result.explicit,
      storefrontCode,
      providerRefs: [
        {
          providerId: "spotify",
          providerTrackId: result.id,
          url: result.external_urls?.spotify,
        },
      ],
      capabilities: ["metadata_only", "external_link"],
      resolutionStatus: "unresolved",
      attribution: [this.getAttribution()],
    };
  }
}
