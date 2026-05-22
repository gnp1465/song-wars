import type { MediaProvider } from "./MediaProvider";
import type {
  MediaProviderId,
  MediaResolutionRequest,
  MediaResolutionResult,
  MediaTrack,
  StorefrontCode,
} from "../../types/media";

export interface ResolveTrackPreviewOptions {
  sourceTrack: MediaTrack;
  storefrontCode: StorefrontCode;
  preferredProviderIds?: MediaProviderId[];
}

export interface MediaResolutionServiceOptions {
  providers: MediaProvider[];
}

export class MediaResolutionService {
  private readonly providers: Map<string, MediaProvider>;

  constructor(options: MediaResolutionServiceOptions) {
    this.providers = new Map(options.providers.map((provider) => [provider.id, provider]));
  }

  async resolveTrackPreview(
    options: ResolveTrackPreviewOptions,
  ): Promise<MediaResolutionResult> {
    const request: MediaResolutionRequest = {
      sourceTrack: options.sourceTrack,
      storefrontCode: options.storefrontCode,
    };

    for (const provider of this.getResolutionProviders(options.preferredProviderIds)) {
      try {
        const result = await provider.resolvePreview(request);

        if (result.status === "resolved" && provider.canStreamInApp(result.track)) {
          return result;
        }
      } catch {
        continue;
      }
    }

    return {
      track: {
        ...options.sourceTrack,
        storefrontCode: options.storefrontCode,
        resolutionStatus: "preview_unavailable",
      },
      status: "preview_unavailable",
      reason: "No registered media provider returned an in-app playable preview.",
    };
  }

  private getResolutionProviders(preferredProviderIds?: MediaProviderId[]): MediaProvider[] {
    if (!preferredProviderIds?.length) {
      return Array.from(this.providers.values());
    }

    return preferredProviderIds
      .map((providerId) => this.providers.get(providerId))
      .filter((provider): provider is MediaProvider => provider !== undefined);
  }
}
