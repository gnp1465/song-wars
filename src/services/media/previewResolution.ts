import { AppleITunesProvider } from "./providers/AppleITunesProvider";
import {
  hasPlayablePreview,
  MediaResolutionService,
} from "./MediaResolutionService";
import type { MediaTrack, StorefrontCode } from "../../types/media";

export async function resolvePlayablePreviewTrack(
  song: MediaTrack,
  storefrontCode: StorefrontCode,
): Promise<MediaTrack> {
  if (hasPlayablePreview(song)) {
    return song;
  }

  const service = new MediaResolutionService({
    providers: [new AppleITunesProvider()],
  });
  const result = await service.resolveTrackPreview({
    preferredProviderIds: ["apple_itunes"],
    sourceTrack: song,
    storefrontCode,
  });

  if (!hasPlayablePreview(result.track)) {
    throw new Error(result.reason ?? "No playable preview found for this song.");
  }

  return result.track;
}
