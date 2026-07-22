export interface OnlineSubmissionSearchMessageOptions {
  errorMessage?: string;
  hasSearched: boolean;
  isSearching: boolean;
  resultCount: number;
}

export function getOnlineSubmissionSearchMessage({
  errorMessage,
  hasSearched,
  isSearching,
  resultCount,
}: OnlineSubmissionSearchMessageOptions): string | undefined {
  if (errorMessage) {
    return errorMessage;
  }

  if (isSearching) {
    return "Searching...";
  }

  if (hasSearched && resultCount === 0) {
    return "No songs found. Try a different song or artist.";
  }

  return undefined;
}
