# Song Wars

Native iOS-first React Native/Expo prototype for a live song battle party game.

## Current Prototype

The local demo currently supports:

- judge topic setup
- songs-per-player setting
- non-judge song submissions
- in-app song preview playback
- duplicate submission blocking
- bracket generation with byes
- winner advancement
- scoring
- next judge assignment
- next round flow
- model-backed fake room/lobby flow
- final winner screen with local play-again/reset actions

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
npm test
```

Type-check the app:

```bash
npx tsc --noEmit
```

## Project Map

Read the architecture guide:

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Learning docs:

- [docs/GLOSSARY.md](docs/GLOSSARY.md)
- [docs/LEARNING_LOG.md](docs/LEARNING_LOG.md)

Main folders:

- `src/screens`: full app screens
- `src/components`: reusable UI pieces
- `src/hooks`: reusable React behavior
- `src/services`: game logic and media provider logic
- `src/types`: shared data shapes
- `src/tests`: manual logic checks
