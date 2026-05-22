import type {
  MediaAttribution,
  MediaPlaybackCapability,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaSearchResult,
  MediaTrack,
  StorefrontCode,
} from "./src/types/media";

export interface MediaSearchOptions {
  query: string;
  storefrontCode: StorefrontCode;
  limit?: number;
}

export interface MediaProvider {
  readonly id: string;
  readonly name: string;

  searchTracks(options: MediaSearchOptions): Promise<MediaSearchResult[]>;

  resolvePreview(request: MediaResolutionRequest): Promise<MediaResolutionResult>;

  canStreamInApp(track: MediaTrack): boolean;

  supportsCapability(track: MediaTrack, capability: MediaPlaybackCapability): boolean;

  getAttribution(track: MediaTrack): MediaAttribution;

  openExternalUrl(track: MediaTrack): string | undefined;
}
