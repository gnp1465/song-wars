import type { MediaProvider, MediaSearchOptions } from "../MediaProvider";
import type {
  MediaAttribution,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaSearchResult,
  MediaTrack,
} from "../../../types/media";

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesTrackResult[];
}

interface ITunesTrackResult {
  trackId: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  trackTimeMillis?: number;
  isStreamable?: boolean;
}

export interface AppleITunesProviderOptions {
  fetcher?: typeof fetch;
}

export class AppleITunesProvider implements MediaProvider {
  readonly id = "apple_itunes";
  readonly name = "Apple Music";

  private readonly fetcher: typeof fetch;

  constructor(options: AppleITunesProviderOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async searchTracks(options: MediaSearchOptions): Promise<MediaSearchResult[]> {
    const response = await this.searchITunes(options.query, options.storefrontCode, options.limit);

    return response.results.map((result) => ({
      sourceProviderId: "apple_itunes",
      track: this.mapITunesTrack(result, options.storefrontCode),
    }));
  }

  async resolvePreview(request: MediaResolutionRequest): Promise<MediaResolutionResult> {
    const query = this.buildResolutionQuery(request.sourceTrack);
    const response = await this.searchITunes(query, request.storefrontCode, 5);
    const match = response.results.find((result) => result.previewUrl);

    if (!match?.previewUrl) {
      return {
        track: {
          ...request.sourceTrack,
          storefrontCode: request.storefrontCode,
          resolutionStatus: "preview_unavailable",
        },
        status: "preview_unavailable",
        reason: "Apple/iTunes did not return a preview URL for this track.",
      };
    }

    const resolvedTrack = this.mergeResolvedPreview(request.sourceTrack, match, request.storefrontCode);

    return {
      track: resolvedTrack,
      resolvedProviderId: "apple_itunes",
      status: "resolved",
    };
  }

  canStreamInApp(track: MediaTrack): boolean {
    return track.preview?.providerId === "apple_itunes" && Boolean(track.preview.streamUrl);
  }

  supportsCapability(track: MediaTrack, capability: MediaTrack["capabilities"][number]): boolean {
    return track.capabilities.includes(capability);
  }

  getAttribution(): MediaAttribution {
    return {
      providerId: "apple_itunes",
      providerName: "Apple Music",
    };
  }

  openExternalUrl(track: MediaTrack): string | undefined {
    return track.providerRefs.find((ref) => ref.providerId === "apple_itunes")?.url;
  }

  private async searchITunes(
    query: string,
    storefrontCode: string,
    limit = 10,
  ): Promise<ITunesSearchResponse> {
    const params = new URLSearchParams({
      term: query,
      country: storefrontCode,
      media: "music",
      entity: "song",
      limit: String(limit),
    });

    const response = await this.fetcher(`https://itunes.apple.com/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Apple/iTunes search failed with status ${response.status}.`);
    }

    return response.json() as Promise<ITunesSearchResponse>;
  }

  private buildResolutionQuery(track: MediaTrack): string {
    return [track.title, track.artists[0]].filter(Boolean).join(" ");
  }

  private mapITunesTrack(result: ITunesTrackResult, storefrontCode: string): MediaTrack {
    return {
      id: `apple_itunes:${result.trackId}`,
      title: result.trackName ?? "Unknown title",
      artists: result.artistName ? [result.artistName] : [],
      albumName: result.collectionName,
      artwork: result.artworkUrl100 ? { url: result.artworkUrl100 } : undefined,
      durationMs: result.trackTimeMillis,
      storefrontCode,
      providerRefs: [
        {
          providerId: "apple_itunes",
          providerTrackId: String(result.trackId),
          url: result.trackViewUrl,
        },
      ],
      capabilities: result.previewUrl ? ["stream_preview"] : ["metadata_only"],
      resolutionStatus: result.previewUrl ? "resolved" : "preview_unavailable",
      preview: result.previewUrl
        ? {
            providerId: "apple_itunes",
            streamUrl: result.previewUrl,
            durationMs: result.trackTimeMillis,
          }
        : undefined,
      attribution: [this.getAttribution()],
    };
  }

  private mergeResolvedPreview(
    sourceTrack: MediaTrack,
    result: ITunesTrackResult,
    storefrontCode: string,
  ): MediaTrack {
    const appleRef = {
      providerId: "apple_itunes" as const,
      providerTrackId: String(result.trackId),
      url: result.trackViewUrl,
    };

    return {
      ...sourceTrack,
      artwork: sourceTrack.artwork ?? (result.artworkUrl100 ? { url: result.artworkUrl100 } : undefined),
      durationMs: sourceTrack.durationMs ?? result.trackTimeMillis,
      storefrontCode,
      providerRefs: [
        ...sourceTrack.providerRefs.filter((ref) => ref.providerId !== "apple_itunes"),
        appleRef,
      ],
      capabilities: Array.from(new Set([...sourceTrack.capabilities, "stream_preview"])),
      resolutionStatus: "resolved",
      preview: {
        providerId: "apple_itunes",
        streamUrl: result.previewUrl ?? "",
        durationMs: result.trackTimeMillis,
      },
      attribution: [
        ...sourceTrack.attribution.filter((item) => item.providerId !== "apple_itunes"),
        this.getAttribution(),
      ],
    };
  }
}
