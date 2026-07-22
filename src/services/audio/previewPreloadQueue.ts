import type { MatchupEntry } from "../../types/game";
import type { PreviewCacheTarget } from "./previewCacheKey";

export function getMatchupPreviewCacheTargets(
  entries: Array<MatchupEntry | undefined>,
): PreviewCacheTarget[] {
  const seenTargets = new Set<string>();
  const targets: PreviewCacheTarget[] = [];

  for (const entry of entries) {
    const previewUrl = entry?.song.preview?.streamUrl;

    if (!entry || !previewUrl) {
      continue;
    }

    const cacheKey = `${entry.song.id}:${previewUrl}`;

    if (seenTargets.has(cacheKey)) {
      continue;
    }

    seenTargets.add(cacheKey);
    targets.push({
      previewUrl,
      trackId: entry.song.id,
    });
  }

  return targets;
}
