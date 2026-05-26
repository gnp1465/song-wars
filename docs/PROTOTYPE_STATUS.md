# Prototype Status

## Frontend Prototype Complete Enough To Demo

- Host creates a local room.
- Guests are added with a temporary display name.
- Room blocks duplicate display names.
- Host sets room mode and songs per player.
- Game starts only with enough players.
- Judge chooses a topic.
- Judge does not submit songs.
- Contestants search, preview, and submit songs.
- Duplicate song submissions are blocked.
- Bracket handles byes and advances winners.
- Judge previews songs and picks winners.
- Scores update after each round.
- Round winner becomes the next judge.
- First player to 3 points wins the game.
- Final winner screen supports play again and reset room.
- Audio Lab can test direct previews and mock Spotify-to-preview resolution.

## Frontend Still Worth Polishing

- Manual phone test pass using `docs/FRONTEND_TEST_PLAN.md`.
- Small spacing and copy tweaks found during device testing.
- Better visual treatment for final bracket history.
- More realistic role-specific screens once real multiplayer starts.

## Waiting For Backend

- Real users joining from separate phones.
- Real room codes and QR codes.
- Host accounts and guest sessions.
- Live room synchronization.
- Server-clock remote playback.
- Persistent game history.
- Monetization tracking.
