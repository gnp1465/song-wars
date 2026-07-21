# iOS Device Pass Guide

Use this guide when the code checks pass and the remaining prototype work is real iPhone or iOS simulator testing.

## Why This Exists

`npm run verify` proves the TypeScript and game rules are working. It cannot prove mobile-only behavior like keyboard placement, speaker audio, safe areas, tap comfort, or text wrapping. The device pass is the final check before calling the frontend prototype complete.

## Before You Start

Run the automated checks:

```bash
npm run verify
```

If this fails, fix the code before doing the device pass.

For simulator testing, also check whether this Mac has the required iOS tooling:

```bash
npm run check:ios-tooling
```

## Option A: Physical iPhone

1. Install Expo Go on the iPhone, unless the project later moves to a custom Expo dev client.
2. Put the iPhone and Mac on the same Wi-Fi network.
3. Start Expo:

```bash
npm start
```

4. Scan the QR code from the terminal or Expo page.
5. Play through `docs/FRONTEND_TEST_PLAN.md`.
6. Record results in `docs/DEVICE_PASS_LOG.md`.
7. Confirm the recorded evidence is complete:

```bash
npm run check:device-pass-log
```

## Option B: iOS Simulator

1. Install Xcode from the Mac App Store.
2. Open Xcode once so it can install required developer components.
3. If simulator tooling is still missing after opening Xcode, run:

```bash
sudo xcodebuild -runFirstLaunch
```

4. Confirm simulator tooling works:

```bash
npm run check:ios-tooling
```

5. Start the app in the simulator:

```bash
npm run ios
```

6. Play through `docs/FRONTEND_TEST_PLAN.md`.
7. Record results in `docs/DEVICE_PASS_LOG.md`.
8. Confirm the recorded evidence is complete:

```bash
npm run check:device-pass-log
```

## What To Pay Extra Attention To

- Can you always stop preview audio?
- Does preview audio stop after submit, winner pick, next round, game reset, and room reset?
- Does the keyboard hide any active input?
- Does any text overlap or get cut off?
- Are buttons comfortable to tap?
- Can you finish a full game without needing a hidden developer action?

## If Something Fails

Write it in `docs/DEVICE_PASS_LOG.md` with:

- what screen you were on
- what you tapped or typed
- what you expected
- what actually happened
- whether it blocks the demo

After that, fix the issue, run `npm run verify`, and repeat only the failed section plus one end-to-end game pass.
