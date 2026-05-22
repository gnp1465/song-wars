export type MediaProviderId = "spotify" | "apple_itunes" | "youtube" | "soundcloud";

export type MediaPlaybackCapability = "metadata_only" | "stream_preview" | "external_link";

export type MediaResolutionStatus =
  | "unresolved"
  | "resolved"
  | "preview_unavailable"
  | "provider_unavailable";

export type StorefrontCode = string;

export interface MediaAttribution {
  providerId: MediaProviderId;
  providerName: string;
  logoUrl?: string;
  legalText?: string;
}

export interface MediaArtwork {
  url: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface ProviderTrackRef {
  providerId: MediaProviderId;
  providerTrackId: string;
  url?: string;
}

export interface MediaPreview {
  providerId: MediaProviderId;
  streamUrl: string;
  durationMs?: number;
  expiresAt?: string;
}

export interface MediaTrack {
  id: string;
  title: string;
  artists: string[];
  albumName?: string;
  artwork?: MediaArtwork;
  durationMs?: number;
  isrc?: string;
  explicit?: boolean;
  storefrontCode?: StorefrontCode;
  providerRefs: ProviderTrackRef[];
  capabilities: MediaPlaybackCapability[];
  resolutionStatus: MediaResolutionStatus;
  preview?: MediaPreview;
  attribution: MediaAttribution[];
}

export interface MediaSearchResult {
  sourceProviderId: MediaProviderId;
  track: MediaTrack;
}

export interface MediaResolutionRequest {
  sourceTrack: MediaTrack;
  storefrontCode: StorefrontCode;
}

export interface MediaResolutionResult {
  track: MediaTrack;
  resolvedProviderId?: MediaProviderId;
  status: MediaResolutionStatus;
  reason?: string;
}
