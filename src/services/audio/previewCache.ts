import { Directory, File, Paths } from "expo-file-system";
import {
  getPreviewCacheFileName,
  getPreviewCacheUri as getPreviewCacheUriWithDirectory,
  type PreviewCacheTarget,
} from "./previewCacheKey";

const PREVIEW_CACHE_FOLDER_NAME = "song-wars-previews";

export async function precachePreview(target: PreviewCacheTarget): Promise<string> {
  const cacheDirectory = getPreviewCacheDirectory();
  const cacheFile = new File(cacheDirectory, getPreviewCacheFileName(target));

  cacheDirectory.create({ idempotent: true, intermediates: true });

  if (cacheFile.exists) {
    return cacheFile.uri;
  }

  const downloadedFile = await File.downloadFileAsync(target.previewUrl, cacheFile, {
    idempotent: true,
  });

  return downloadedFile.uri;
}

export async function clearPreviewCache(): Promise<void> {
  const cacheDirectory = getPreviewCacheDirectory();

  if (cacheDirectory.exists) {
    cacheDirectory.delete();
  }
}

export function getPreviewCacheUri(
  target: PreviewCacheTarget,
  cacheDirectory = Paths.cache.uri,
): string | undefined {
  return getPreviewCacheUriWithDirectory(target, cacheDirectory);
}

function getPreviewCacheDirectory(): Directory {
  return new Directory(Paths.cache, PREVIEW_CACHE_FOLDER_NAME);
}

export { getPreviewCacheFileName, type PreviewCacheTarget };
