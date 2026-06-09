import { Keyboard } from "react-native";
import { useState } from "react";
import { AppleITunesProvider } from "../services/media/providers/AppleITunesProvider";
import type { MediaProvider } from "../services/media/MediaProvider";
import type { MediaTrack } from "../types/media";

export interface UseSongSearchOptions {
  initialQuery?: string;
  limit?: number;
  provider?: MediaProvider;
  storefrontCode?: string;
}

export function useSongSearch(options: UseSongSearchOptions = {}) {
  const [query, setQuery] = useState(options.initialQuery ?? "");
  const [results, setResults] = useState<MediaTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function search(): Promise<{ ok: boolean; errorMessage?: string }> {
    const trimmedQuery = query.trim();

    Keyboard.dismiss();

    if (isSearching) {
      return { ok: false, errorMessage: "Search already in progress." };
    }

    if (!trimmedQuery) {
      const nextErrorMessage = "Enter a song or artist to search.";

      setResults([]);
      setErrorMessage(nextErrorMessage);
      return { ok: false, errorMessage: nextErrorMessage };
    }

    setIsSearching(true);
    setErrorMessage(undefined);

    try {
      const provider = options.provider ?? new AppleITunesProvider();
      const searchResults = await provider.searchTracks({
        query: trimmedQuery,
        storefrontCode: options.storefrontCode ?? "US",
        limit: options.limit ?? 8,
      });

      setResults(searchResults.map((result) => result.track));
      return { ok: true };
    } catch (error) {
      const nextErrorMessage = error instanceof Error ? error.message : "Song search failed.";
      setErrorMessage(nextErrorMessage);
      return { ok: false, errorMessage: nextErrorMessage };
    } finally {
      setIsSearching(false);
    }
  }

  function clearResults() {
    setResults([]);
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setErrorMessage(undefined);
  }

  return {
    clearResults,
    errorMessage,
    isSearching,
    query,
    results,
    search,
    setErrorMessage,
    setQuery: updateQuery,
  };
}
