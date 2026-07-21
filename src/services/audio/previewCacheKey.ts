export interface PreviewCacheTarget {
  previewUrl: string;
  trackId: string;
}

export function getPreviewCacheUri(
  target: PreviewCacheTarget,
  cacheDirectory: string | undefined,
): string | undefined {
  if (!cacheDirectory) {
    return undefined;
  }

  return `${cacheDirectory}song-wars-previews/${getPreviewCacheFileName(target)}`;
}

export function getPreviewCacheFileName({ previewUrl, trackId }: PreviewCacheTarget): string {
  return `${sanitizeCachePart(trackId)}-${hashString(previewUrl)}.m4a`;
}

function sanitizeCachePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "track";
}

function hashString(value: string): string {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}
