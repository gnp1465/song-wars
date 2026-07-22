export const MAX_ONLINE_DISPLAY_NAME_LENGTH = 32;

export function normalizeOnlineDisplayName(displayName: string): string {
  return displayName.trim();
}

export function hasOnlineDisplayName(displayName: string): boolean {
  return normalizeOnlineDisplayName(displayName).length > 0;
}

export function isValidOnlineDisplayName(displayName: string): boolean {
  return getOnlineDisplayNameValidationMessage(displayName) === undefined;
}

export function getOnlineDisplayNameValidationMessage(
  displayName: string,
): string | undefined {
  const normalizedDisplayName = normalizeOnlineDisplayName(displayName);

  if (normalizedDisplayName.length === 0) {
    return "Enter a display name.";
  }

  if (normalizedDisplayName.length > MAX_ONLINE_DISPLAY_NAME_LENGTH) {
    return `Display names must be ${MAX_ONLINE_DISPLAY_NAME_LENGTH} characters or less.`;
  }

  return undefined;
}
