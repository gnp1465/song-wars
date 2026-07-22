import assert from "node:assert/strict";
import { getOnlineSubmissionSearchMessage } from "../services/online/onlineSubmissionSearchState.ts";

assert.equal(
  getOnlineSubmissionSearchMessage({
    errorMessage: "Song search failed.",
    hasSearched: false,
    isSearching: false,
    resultCount: 0,
  }),
  "Song search failed.",
  "search errors should be shown first",
);
assert.equal(
  getOnlineSubmissionSearchMessage({
    hasSearched: false,
    isSearching: true,
    resultCount: 0,
  }),
  "Searching...",
  "loading state should be visible while search is running",
);
assert.equal(
  getOnlineSubmissionSearchMessage({
    hasSearched: true,
    isSearching: false,
    resultCount: 0,
  }),
  "No songs found. Try a different song or artist.",
  "empty search results should show a useful retry hint",
);
assert.equal(
  getOnlineSubmissionSearchMessage({
    hasSearched: false,
    isSearching: false,
    resultCount: 0,
  }),
  undefined,
  "the initial submission screen should not add extra helper clutter",
);
assert.equal(
  getOnlineSubmissionSearchMessage({
    hasSearched: true,
    isSearching: false,
    resultCount: 2,
  }),
  undefined,
  "successful searches with results should not show an empty-state message",
);

console.log("Online submission search state checks passed.");
