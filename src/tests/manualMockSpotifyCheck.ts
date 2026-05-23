import assert from "node:assert/strict";
import { MockSpotifyProvider } from "../services/media/providers/MockSpotifyProvider.ts";

const provider = new MockSpotifyProvider();
const results = await provider.searchTracks({
  query: "golden",
  storefrontCode: "US",
  limit: 5,
});

assert.equal(results.length, 1);
assert.equal(results[0].sourceProviderId, "spotify");
assert.equal(results[0].track.title, "Golden");
assert.equal(results[0].track.resolutionStatus, "unresolved");
assert.equal(results[0].track.capabilities.includes("metadata_only"), true);

const preview = await provider.resolvePreview({
  sourceTrack: results[0].track,
  storefrontCode: "US",
});

assert.equal(preview.status, "preview_unavailable");

console.log("Mock Spotify provider checks passed.");
