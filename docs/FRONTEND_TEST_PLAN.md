# Frontend Prototype Test Plan

Use this checklist when testing the local/offline frontend prototype.

## Lobby

- Create a room as the host.
- Confirm the host name locks after room creation.
- Confirm the lobby starts with only the host.
- Try to start with fewer than 3 players and confirm the start button is disabled.
- Try tapping Add with missing room code or guest name and confirm the button is disabled or a clear error appears.
- Enter a wrong room code, then edit the field and confirm the stale error clears.
- Add two guests with room code `7392`.
- Try a duplicate guest name and confirm it is blocked.
- Remove a guest and confirm the start button disables again.
- Change audio mode, songs per player, and points to win.
- Confirm songs-per-player and points-to-win controls show their allowed ranges and stop at the min/max.
- Start the game.

## Submissions

- Confirm the judge is not asked to submit a song.
- On the topic screen, type a topic and confirm the keyboard Done key starts the battle.
- Confirm the current submitting player is shown.
- Search for a song.
- Try searching with a blank query and confirm it is blocked.
- Confirm loading, empty, and error states are understandable.
- Play a preview.
- Tap Stop while a preview is loading and confirm audio does not start afterward.
- Submit a song and confirm preview audio stops.
- Try fast double-tapping Submit and confirm only one submission is accepted.
- Try submitting a duplicate song and confirm it is blocked.
- Finish all required submissions.

## Judging

- Confirm the topic, judge, audio mode, and points-to-win are visible.
- Confirm the active bracket matchup is marked as `Now judging`.
- Play both song previews.
- Pick a winner and confirm preview audio stops.
- Try fast double-tapping Pick Winner and confirm the bracket advances only once.
- Confirm completed matchups and byes are labeled clearly in the bracket.
- Finish the round and confirm the winner gets a point.
- With two songs per player, confirm the round result shows the exact winning song, not just another song from that player.
- Confirm the round result does not show stale judging instructions or the completed bracket.
- Start the next round and confirm the round winner becomes the next judge.

## Game Completion

- Continue rounds until a player reaches the configured point target.
- Confirm the final winner screen appears.
- Tap `Play Again` and confirm the same room starts a fresh local game.
- Tap `Reset Room` and confirm the app returns to room creation.

## Accessibility And Device Polish

- Turn on VoiceOver or inspect accessibility labels and confirm core controls have clear names.
- Confirm disabled buttons are announced or shown as disabled.
- Confirm no text overlaps on the target iPhone/simulator size.
- Confirm keyboard behavior feels correct in the lobby and song search.

## Regression Checks

Run these before pushing frontend changes:

```bash
npm run verify
```

## Online Multiplayer Device Pass

Run this after the latest Supabase migrations have been applied to the hosted development project.

- Start the app on two physical iPhones or one iPhone plus one simulator.
- On device A, create an online room with a display name.
- Confirm there is no visible login screen and the room shows a six-digit code.
- On device B, join the room with the six-digit code.
- Create another room and confirm device B can also join by scanning the QR code.
- Change songs per player, points to win, and room mode as host; confirm the guest sees each update.
- Background device B for a few seconds, reopen it, and confirm the latest player/settings state is shown.
- Fully return to Home and confirm Resume Online Room returns to the correct lobby or round.
- Remove device B as host and confirm device B returns Home with a clear message.
- Rejoin device B, add a third player/device or simulator, then start the room.
- Confirm all devices transition to Round 1 setup.
- Submit the topic as judge and confirm all devices move into submissions.
- Confirm the judge cannot submit songs.
- Submit all contestant songs and confirm all devices move into judging.
- Pick winners as judge and confirm contestants cannot pick winners.
- Finish the round and confirm the winner gets one point and becomes the next judge.
- Finish a first-to-one online game and confirm the final winner screen appears.
- Tap Play Again as host and confirm the same players stay in the room with fresh game state.
- In Remote Sync mode, schedule a synced preview and confirm all devices show locked playback progress.
