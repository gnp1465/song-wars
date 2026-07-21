export function normalizeOnlineDisplayName(displayName: string): string {
  return displayName.trim();
}

export function hasOnlineDisplayName(displayName: string): boolean {
  return normalizeOnlineDisplayName(displayName).length > 0;
}
