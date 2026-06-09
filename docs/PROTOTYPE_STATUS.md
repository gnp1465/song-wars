# Prototype Status

## Frontend Prototype Complete Enough To Demo

- Host creates a local room.
- Main flow uses product-facing Song Wars copy instead of internal demo labels.
- Guests are added with a temporary display name.
- Room blocks duplicate display names.
- Host sets room mode and songs per player.
- Host sets the points needed to win.
- Game starts only with enough players.
- Judge chooses a topic.
- Each game phase clearly shows whose turn it is and what action comes next.
- Judge does not submit songs.
- Contestants search, preview, and submit songs.
- Duplicate song submissions are blocked.
- Bracket handles byes and advances winners.
- Bracket display groups matchups by round and labels active, pending, complete, and bye states.
- Judge previews songs and picks winners.
- Scores update after each round.
- Round winner becomes the next judge.
- First player to the configured point target wins the game.
- Final winner screen supports play again and reset room.
- Preview playback works inside the core game flow.

## Frontend Still Worth Polishing

- Manual phone test pass using `docs/FRONTEND_TEST_PLAN.md`.
- Small spacing tweaks found during device testing.
- Final device polish after another real iPhone test pass.
- More realistic role-specific screens once real multiplayer starts.
- Dev-only audio lab can stay available in code, but it should remain out of the main player flow.

## Waiting For Backend

- Real users joining from separate phones.
- Real room codes and QR codes.
- Host accounts and guest sessions.
- Live room synchronization.
- Server-clock remote playback.
- Persistent game history.
- Monetization tracking.
