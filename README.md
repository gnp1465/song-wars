# Song Wars

Native iOS-first React Native/Expo prototype for a live song battle party game.

## Current Frontend Prototype

The local/offline prototype currently supports the full core game loop:

- local room creation
- guest display-name join simulation
- duplicate display-name blocking
- room settings for audio mode, songs per player, and points to win
- judge topic setup
- non-judge song submissions
- in-app song preview playback
- duplicate submission blocking
- bracket generation with byes
- first-round same-player matchup avoidance where possible
- grouped bracket progress by round
- winner advancement
- scoring
- next judge assignment
- next round flow
- final winner screen with local play-again/reset actions

Backend, real accounts, real multiplayer room sync, payments, and persistent history are intentionally out of scope for this frontend prototype.

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

## Run Checks

```bash
npm run verify
```

This runs the TypeScript check and all local logic tests.

Run only the local logic tests:

```bash
npm test
```

## Project Map

Read the architecture guide:

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Learning docs:

- [docs/GLOSSARY.md](docs/GLOSSARY.md)
- [docs/LEARNING_LOG.md](docs/LEARNING_LOG.md)
- [docs/FRONTEND_TEST_PLAN.md](docs/FRONTEND_TEST_PLAN.md)
- [docs/IOS_DEVICE_PASS_GUIDE.md](docs/IOS_DEVICE_PASS_GUIDE.md)
- [docs/DEVICE_PASS_LOG.md](docs/DEVICE_PASS_LOG.md)
- [docs/PROTOTYPE_STATUS.md](docs/PROTOTYPE_STATUS.md)
- [docs/FRONTEND_COMPLETION_AUDIT.md](docs/FRONTEND_COMPLETION_AUDIT.md)

Main folders:

- `src/screens`: full app screens
- `src/components`: reusable UI pieces
- `src/hooks`: reusable React behavior
- `src/services`: game logic and media provider logic
- `src/types`: shared data shapes
- `src/tests`: manual logic checks
