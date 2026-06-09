import assert from "node:assert/strict";
import {
  hasPlayablePreview,
  MediaResolutionService,
} from "../services/media/MediaResolutionService.ts";
import type { MediaProvider, MediaSearchOptions } from "../services/media/MediaProvider.ts";
import type {
  MediaAttribution,
  MediaPlaybackCapability,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaSearchResult,
  MediaTrack,
} from "../types/media.ts";

class MockApplePreviewProvider implements MediaProvider {
  readonly id: MediaProvider["id"] = "apple_itunes";
  readonly name: MediaProvider["name"] = "Apple Music";

  async searchTracks(_options: MediaSearchOptions): Promise<MediaSearchResult[]> {
    return [];
  }

  async resolvePreview(request: MediaResolutionRequest): Promise<MediaResolutionResult> {
    return {
      status: "resolved",
      resolvedProviderId: "apple_itunes",
      track: {
        ...request.sourceTrack,
        storefrontCode: request.storefrontCode,
        resolutionStatus: "resolved",
        capabilities: ["metadata_only", "external_link", "stream_preview"],
        preview: {
          providerId: "apple_itunes",
          streamUrl: "https://example.com/preview.m4a",
          durationMs: 30000,
        },
      },
    };
  }

  canStreamInApp(track: MediaTrack): boolean {
    return track.preview?.providerId === "apple_itunes" && Boolean(track.preview.streamUrl);
  }

  supportsCapability(track: MediaTrack, capability: MediaPlaybackCapability): boolean {
    return track.capabilities.includes(capability);
  }

  getAttribution(_track: MediaTrack): MediaAttribution {
    return {
      providerId: "apple_itunes",
      providerName: "Apple Music",
    };
  }

  openExternalUrl(_track: MediaTrack): string | undefined {
    return undefined;
  }
}

class MockUnavailableProvider extends MockApplePreviewProvider {
  readonly id: MediaProvider["id"] = "youtube";
  readonly name: MediaProvider["name"] = "YouTube";

  async resolvePreview(request: MediaResolutionRequest): Promise<MediaResolutionResult> {
    return {
      status: "preview_unavailable",
      resolvedProviderId: "youtube",
      reason: "No preview found.",
      track: {
        ...request.sourceTrack,
        resolutionStatus: "preview_unavailable",
      },
    };
  }
}

class ThrowingProvider extends MockApplePreviewProvider {
  async resolvePreview(_request: MediaResolutionRequest): Promise<MediaResolutionResult> {
    throw new Error("Provider should not be called for tracks that already have previews.");
  }
}

const spotifyTrack: MediaTrack = {
  id: "spotify:track:123",
  title: "Example Song",
  artists: ["Example Artist"],
  albumName: "Example Album",
  storefrontCode: "US",
  providerRefs: [
    {
      providerId: "spotify",
      providerTrackId: "123",
      url: "https://open.spotify.com/track/123",
    },
  ],
  capabilities: ["metadata_only", "external_link"],
  resolutionStatus: "unresolved",
  attribution: [
    {
      providerId: "spotify",
      providerName: "Spotify",
    },
  ],
};

const service = new MediaResolutionService({
  providers: [new MockUnavailableProvider(), new MockApplePreviewProvider()],
});

const resolved = await service.resolveTrackPreview({
  sourceTrack: spotifyTrack,
  storefrontCode: "US",
  preferredProviderIds: ["youtube", "apple_itunes"],
});

assert.equal(resolved.status, "resolved");
assert.equal(resolved.resolvedProviderId, "apple_itunes");
assert.equal(resolved.track.preview?.streamUrl, "https://example.com/preview.m4a");
assert.equal(resolved.track.resolutionStatus, "resolved");
assert.equal(resolved.track.storefrontCode, "US");

const alreadyPlayableTrack: MediaTrack = {
  ...spotifyTrack,
  capabilities: ["metadata_only", "stream_preview"],
  preview: {
    providerId: "apple_itunes",
    streamUrl: "https://example.com/already-playable.m4a",
    durationMs: 30000,
  },
  resolutionStatus: "resolved",
};
const alreadyResolved = await new MediaResolutionService({
  providers: [new ThrowingProvider()],
}).resolveTrackPreview({
  sourceTrack: alreadyPlayableTrack,
  storefrontCode: "US",
  preferredProviderIds: ["apple_itunes"],
});

assert.equal(hasPlayablePreview(alreadyPlayableTrack), true);
assert.equal(alreadyResolved.status, "resolved");
assert.equal(alreadyResolved.track.preview?.streamUrl, "https://example.com/already-playable.m4a");

const unavailable = await new MediaResolutionService({
  providers: [new MockUnavailableProvider()],
}).resolveTrackPreview({
  sourceTrack: spotifyTrack,
  storefrontCode: "US",
  preferredProviderIds: ["youtube"],
});

assert.equal(unavailable.status, "preview_unavailable");
assert.equal(unavailable.track.resolutionStatus, "preview_unavailable");

console.log("Media resolution checks passed.");
