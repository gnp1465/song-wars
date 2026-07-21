# Prototype Status

## Frontend Prototype Scope

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
- Search and preview resolution use the device locale storefront when possible.

## Final Verification

- Run `npx tsc --noEmit`.
- Run `npm test`.
- Use `docs/IOS_DEVICE_PASS_GUIDE.md` to launch the app on a phone or simulator.
- Complete a manual phone/simulator pass using `docs/FRONTEND_TEST_PLAN.md`.
- Record the device pass results in `docs/DEVICE_PASS_LOG.md`.
- Run `npm run check:device-pass-log` after filling out the device pass log.
- Run `npm run check:prototype-complete` as the final frontend prototype gate.
- Fix any spacing or copy issues found during the manual pass.

## Later Product Improvements

- Dev-only audio lab can stay available in code, but it should remain out of the main player flow.

## Backend Foundation

- Supabase anonymous sessions for hosts and guests.
- Six-digit online rooms.
- Live lobby synchronization.
- Host-only settings, removals, and start.
- Synchronized transition to Round 1 setup.
- Online judge topic submission.
- Online song submission with duplicate blocking.
- Online song submission requires an in-app playable preview URL.
- Automatic transition from submitting to judging.
- Online bracket judging and score updates.
- Round winner becomes next judge online.
- Final winner state.
- Host-only online Play Again.
- Host room closing after online gameplay starts.
- QR-code join link for online lobby invites.
- Home resume action for the last verified online room on the current device.
- Online room heartbeat refetch for reconnect/Realtime recovery.
- Remote playback clock-offset and pre-cache foundation utilities.
- Server-scheduled remote preview events.
- Remote synchronized playback lock/progress UI.
- iOS bundle identifier and `songwars://` deep-link scheme.
- Native app icon and splash assets are configured and checked by `npm run verify`.
- Root error boundary with a recovery screen for unexpected React errors.
- Privacy policy draft and launch-readiness docs are checked by `npm run verify`.

## Waiting For Later Backend Milestones

- Persistent game history.
- Monetization tracking.
