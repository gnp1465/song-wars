# Song Wars

Native iOS-first React Native/Expo prototype for a live song battle party game.

## Current App

The app now has two paths:

- `Local Game`: the completed offline prototype with room creation, song search, preview playback, bracket judging, scoring, and final winner.
- `Online Room`: the Supabase-backed multiplayer path with anonymous sessions, six-digit room codes, QR join, live player/settings sync, removals, online topic setup, song submissions, bracket judging, scoring, final winner, host-controlled play-again/reset flow, and server-scheduled remote preview sync.

Payments, persistent history, and account upgrades are later milestones.

## Run The App

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Then open the app with Expo Go or an iOS simulator.

For online rooms, create `.env` from `.env.example`. A separate `.env.production.example` exists for later release builds. Then follow:

[docs/ONLINE_ROOM_SETUP.md](docs/ONLINE_ROOM_SETUP.md)

## Run Checks

```bash
npm run verify
```

This runs the TypeScript check and all local logic tests.

Run only the local logic tests:

```bash
npm test
```

Run the hosted Supabase online-room smoke check after applying the migration:

```bash
npm run check:online-room
```

After completing the phone or simulator pass and filling out `docs/DEVICE_PASS_LOG.md`, run the final frontend prototype gate:

```bash
npm run check:prototype-complete
```

## Project Map

Read the architecture guide:

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Learning docs:

- [docs/GLOSSARY.md](docs/GLOSSARY.md)
- [docs/LEARNING_LOG.md](docs/LEARNING_LOG.md)
- [docs/FRONTEND_TEST_PLAN.md](docs/FRONTEND_TEST_PLAN.md)
- [docs/IOS_DEVICE_PASS_GUIDE.md](docs/IOS_DEVICE_PASS_GUIDE.md)
- [docs/ONLINE_ROOM_SETUP.md](docs/ONLINE_ROOM_SETUP.md)
- [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)
- [docs/DEVICE_PASS_LOG.md](docs/DEVICE_PASS_LOG.md)
- [docs/PROTOTYPE_STATUS.md](docs/PROTOTYPE_STATUS.md)
- [docs/FRONTEND_COMPLETION_AUDIT.md](docs/FRONTEND_COMPLETION_AUDIT.md)

Main folders:

- `src/screens`: full app screens
- `src/components`: reusable UI pieces
- `src/hooks`: reusable React behavior
- `src/services`: game logic, media provider logic, Supabase, and online room services
- `src/types`: shared data shapes
- `src/tests`: manual logic checks
- `supabase/migrations`: hosted Supabase schema and RPC migrations
