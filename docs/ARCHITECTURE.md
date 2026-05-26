# Song Wars Architecture

This app is organized in layers. Each layer has a different job.

## App Entry

`App.tsx` starts the app, configures preview audio, and switches between the Battle and Preview screens.

Memorize: the entry file should stay small. It chooses top-level screens; it should not contain game rules.

## Screens

Screens are full app views. They coordinate user flow and state.

- `src/screens/LocalBattleDemoScreen.tsx` runs the local playable game demo.
- `src/screens/RoomFlowDemoScreen.tsx` runs the fake room/lobby flow using the shared room model.
- `src/screens/PreviewPlaybackScreen.tsx` is a lab screen for testing search and preview playback.

Memorize: screens are allowed to coordinate several pieces, but if a screen gets too large, repeated UI should move into components and repeated behavior should move into hooks.

## Components

Components are reusable visual pieces.

- `AudioStatusBar` shows current audio status and the Stop button.
- `PlayerList` shows lobby players, guest removal, and start readiness.
- `RoomSettingsPanel` shows room settings controls.
- `SongActionCard` shows a song with action buttons.
- `Scoreboard` shows player scores.
- `BracketProgress` shows the tournament state.
- `SubmissionProgress` shows who has submitted.

Memorize: components receive props and render UI. They should not own deep game rules.

## Hooks

Hooks are reusable React behavior.

- `usePreviewAudio` owns preview playback state and actions.
- `useSongSearch` owns search query, loading state, results, and errors.

Memorize: hooks are the "brain" a component or screen can reuse.

## Services

Services hold business logic and provider/API logic.

- `services/game/bracket.ts` creates and advances brackets.
- `services/game/room.ts` creates and updates room objects.
- `services/game/scoring.ts` scores completed rounds.
- `services/media/MediaResolutionService.ts` resolves selected songs to playable previews.
- `services/media/providers/*` adapt external music sources to the app's shared media shape.

Memorize: services should be testable without opening the app.

## Types

Types define data shapes.

- `types/media.ts` defines songs, providers, previews, and attribution.
- `types/game.ts` defines players, submissions, matchups, rounds, and settings.

Memorize: types are contracts. They make the app easier to reason about because every layer agrees on what the data looks like.

## Data

`src/data/demoGame.ts` holds fake demo data: players, topics, and sample tracks.

Memorize: demo data is temporary. Later, real room and backend data will replace it.

## Tests

`src/tests/*` are manual test scripts for core logic.

Run all checks:

```bash
npm test
```

Memorize: tests protect rules. If a bracket bug comes back, the bracket test should catch it.
