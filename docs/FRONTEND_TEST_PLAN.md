# Frontend Prototype Test Plan

Use this checklist when testing the local/offline frontend prototype.

## Lobby

- Create a room as the host.
- Confirm the host name locks after room creation.
- Confirm the lobby starts with only the host.
- Try to start with fewer than 3 players and confirm the start button is disabled.
- Add two guests with room code `7392`.
- Try a duplicate guest name and confirm it is blocked.
- Remove a guest and confirm the start button disables again.
- Change audio mode and songs per player.
- Start the game.

## Submissions

- Confirm the judge is not asked to submit a song.
- Confirm the current submitting player is shown.
- Search for a song.
- Confirm loading, empty, and error states are understandable.
- Play a preview.
- Submit a song and confirm preview audio stops.
- Try submitting a duplicate song and confirm it is blocked.
- Finish all required submissions.

## Judging

- Confirm the topic, judge, audio mode, and points-to-win are visible.
- Confirm the active bracket matchup is marked as `Now judging`.
- Play both song previews.
- Pick a winner and confirm preview audio stops.
- Confirm completed matchups and byes are labeled clearly in the bracket.
- Finish the round and confirm the winner gets a point.
- Start the next round and confirm the round winner becomes the next judge.

## Game Completion

- Continue rounds until a player reaches 3 points.
- Confirm the final winner screen appears.
- Tap `Play Again` and confirm the same room starts a fresh local game.
- Tap `Reset Room` and confirm the app returns to room creation.

## Regression Checks

Run these before pushing frontend changes:

```bash
npx tsc --noEmit
npm test
```
