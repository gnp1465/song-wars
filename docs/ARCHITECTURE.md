# Song Wars Architecture

This app is organized in layers. Each layer has a different job.

## App Entry And Navigation

Expo Router owns the app entry. `app/_layout.tsx` configures preview audio, wraps the app in a root error boundary, and renders the route stack.

`app.json` owns native app identity such as the iOS bundle identifier and `songwars` deep-link scheme. `npm run check:app-config` verifies the iOS-first beta assumptions in that file.

Memorize: the entry layer should stay small. It chooses top-level routes; it should not contain game rules.

## Screens

Screens are full app views. They coordinate user flow and state.

- `app/index.tsx` is the home screen for Local Game and Online Room choices.
- `app/local.tsx` launches the completed local prototype.
- `app/online/*` contains the Supabase-backed create, join, lobby, and round setup routes.
- The online lobby uses an Expo deep link QR code to prefill the Join screen room code.
- `src/screens/LocalBattleDemoScreen.tsx` runs the local playable battle flow.
- `src/screens/RoomFlowDemoScreen.tsx` runs the local room/lobby flow using the shared room model.
- `src/screens/PreviewPlaybackScreen.tsx` is a dev-only lab screen for testing search and preview playback. It is not part of the main app surface.

Memorize: screens are allowed to coordinate several pieces, but if a screen gets too large, repeated UI should move into components and repeated behavior should move into hooks.

## Components

Components are reusable visual pieces.

- `AudioStatusBar` shows current audio status and the Stop button.
- `ActiveMatchupPanel` shows the current song-vs-song judging controls.
- `BattleStatusHeader` shows topic, judge, mode, and win condition during judging.
- `GameOverPanel` shows the final winner and restart actions.
- `JudgeSetupPanel` shows judge topic setup and round settings.
- `OnlineJudgingPanel` shows active online matchup judging, bracket progress, Remote Sync controls, and scores.
- `OnlineOutcomePanels` shows online round-complete and game-complete states.
- `OnlinePlayerList` shows online room members, host removal controls, and Presence status.
- `OnlineRemotePlayback` shows Remote Sync preview controls and locked playback progress.
- `OnlineSubmissionPanel` shows online submission progress, contestant search, preview, submit, and remove controls.
- `OnlineTopicPanel` shows the current online judge, topic display, and judge-only topic input.
- `PlayerList` shows lobby players, guest removal, and start readiness.
- `RoundResultPanel` shows the completed round winner and next-round action.
- `RoomSettingsPanel` shows room settings controls.
- `SongActionCard` shows a song with action buttons.
- `SubmissionSearchPanel` shows the active submitter, search states, and submission actions.
- `Scoreboard` shows player scores.
- `BracketProgress` shows the tournament state.
- `SubmissionProgress` shows who has submitted.
- `TurnGuidance` shows the current phase, acting player, and next expected action.

Memorize: components receive props and render UI. They should not own deep game rules.

## Hooks

Hooks are reusable React behavior.

- `usePreviewAudio` owns preview playback state and actions.
- `useSongSearch` owns search query, loading state, results, and errors.
- `useOnlineRoom` owns online room snapshots, realtime subscriptions, Presence, mutation state, foreground refreshes, and a heartbeat refetch for missed socket events.

Memorize: hooks are the "brain" a component or screen can reuse.

## Services

Services hold business logic and provider/API logic.

- `services/game/bracket.ts` creates and advances brackets.
- `services/game/room.ts` creates and updates room objects.
- `services/game/scoring.ts` scores completed rounds.
- `services/online/*` creates anonymous sessions, normalizes and validates display names, stores display names, and calls room RPC functions.
- `services/online/onlineRoomAccess.ts` centralizes when online users should be returned Home after removal, room closure, or expiration.
- `services/online/onlineRoomExpiry.ts` formats temporary-room expiration labels for the lobby UI.
- `services/online/onlineRoomPresence.ts` formats online/offline status and active-room presence summaries.
- `services/online/onlineRoomResume.ts` decides whether a verified snapshot can resume to lobby or round.
- `services/online/onlineRoomResumeStorage.ts` stores only the last room ID for this app installation.
- `services/online/onlineRoomSnapshotMapper.ts` maps raw Supabase RPC JSON into app-level online room types.
- `services/online/onlineRoundDisplay.ts` maps online round status values to player-facing titles and helper copy.
- `services/online/onlineRoundCleanup.ts` maps online round actions to the audio/search/cache cleanup each action should run.
- `services/online/onlineSubmissionSearchState.ts` maps online submission search state to the short player-facing loading, error, or empty-result message.
- `services/online/onlineRoundTopic.ts` holds the client-side topic input rules used before calling the server.
- `services/online/onlineRoundSubmissions.ts` holds the client-side submission eligibility, duplicate-song checks, and progress helpers used before calling the server.
- `services/online/onlineRoundJudging.ts` holds the client-side active-matchup and judging eligibility helpers used before calling the server.
- `services/audio/remotePlaybackSync.ts` holds server-clock offset and synced playback timing math.
- `services/audio/previewCache.ts` holds local preview-cache helpers for remote synchronized playback and cleanup on room/round lifecycle exits.
- `services/media/storefront.ts` derives an Apple/iTunes storefront code from the device locale, with `US` as a fallback.
- `services/online/onlinePlaybackEvents.ts` picks the newest server-scheduled synced preview event for the current room.
- `services/supabase/*` configures the typed Supabase React Native client.
- `services/diagnostics/logger.ts` centralizes local error reporting and redacts common token-like values until a production crash service is added. See `docs/DIAGNOSTICS.md`.
- `services/media/MediaResolutionService.ts` resolves selected songs to playable previews.
- `services/media/providers/*` adapt external music sources to the app's shared media shape.

Memorize: services should be testable without opening the app.

## Types

Types define data shapes.

- `types/media.ts` defines songs, providers, previews, and attribution.
- `types/game.ts` defines players, submissions, matchups, rounds, and settings.
- `types/onlineRoom.ts` defines app-level online room snapshots, members, presence, and rounds.
- `types/supabase.ts` defines the generated-style Supabase database contract used by the client.

Memorize: types are contracts. They make the app easier to reason about because every layer agrees on what the data looks like.

## Data

`src/data/demoGame.ts` holds local prototype data: players, topics, and sample tracks.

Memorize: demo data is temporary. Later, real room and backend data will replace it.

## Supabase

`supabase/migrations/*` defines the hosted database schema, security rules, and RPC functions. Online gameplay state is added in slices: lobby first, then topic setup, song submissions, bracket judging and scoring, host-controlled game reset, and remote playback events.

Memorize: the app uses the public anon key only. Server-authoritative actions happen through RPC functions protected by Row Level Security and `auth.uid()`.

## Tests

`src/tests/*` are manual test scripts for core logic.

`scripts/check-online-room-schema.mjs` is a local contract check for the committed Supabase migration. It does not replace the hosted Supabase check, but it catches missing tables, RPC functions, RLS policies, Realtime Presence policies, and publication setup before deployment.

Run all checks:

```bash
npm test
```

Memorize: tests protect rules. If a bracket bug comes back, the bracket test should catch it.
