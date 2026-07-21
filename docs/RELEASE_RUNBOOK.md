# Release Runbook

Use this runbook when preparing a Song Wars beta build. A runbook is an ordered checklist for a repeated operation. In this case, the operation is proving that the app, backend, and device behavior are ready for testers.

## 1. Confirm Scope

- Beta target: iOS-first multiplayer beta.
- Authentication: anonymous Supabase sessions only.
- Payments: out of scope.
- Persistent accounts: out of scope.
- Persistent game history: out of scope.
- Required game path: create or join online room, submit topic, submit songs, judge bracket, score rounds, finish game, play again or close room.

If the App Store metadata or privacy policy describes anything outside that scope, update the docs before release.

## 2. Confirm Local Configuration

Create or update `.env` for development testing:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

For release builds, create `.env.production` locally from `.env.production.example`. Do not commit `.env.production`.

Check configuration:

```bash
npm run check:supabase-env
```

## 3. Apply Backend Migrations

Print the ordered Supabase SQL:

```bash
npm run print:supabase-migrations
```

Paste the output into the Supabase SQL editor for the intended development or production project. Apply every migration in order. Never paste a service role key into the mobile app or commit one to git.

After applying migrations, wait briefly for Supabase's schema cache to refresh before running hosted checks.

## 4. Run Automated Checks

Run the full local gate:

```bash
npm run verify
```

Run the hosted backend smoke check:

```bash
npm run check:online-room
```

Run the optional capacity check when Supabase auth rate limits are not a concern:

```bash
CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room
```

Do not continue to device testing while any of these checks are failing.

## 5. Confirm iOS Tooling

For simulator testing, run:

```bash
npm run check:ios-tooling
```

If this fails because `simctl` is missing, open Xcode once and let it finish installing developer components. If it still fails, run:

```bash
sudo xcodebuild -runFirstLaunch
```

Physical iPhone testing is still required before beta, even if simulator checks pass.

## 6. Run Device Matrix

Use `docs/BETA_DEVICE_MATRIX.md` to choose devices and scenarios. At minimum, test:

- one recent physical iPhone
- one older supported physical iPhone
- at least two devices in one online room
- at least three total players in one online game
- speaker audio, Bluetooth audio, and silent-switch behavior
- Wi-Fi and cellular or hotspot behavior

Record results in `docs/DEVICE_PASS_LOG.md`.

## 7. Confirm Device Evidence

After filling out the pass log, run:

```bash
npm run check:device-pass-log
```

Then run the final prototype completion gate:

```bash
npm run check:prototype-complete
```

If a row is marked `Fail` or `Needs follow-up`, either fix the issue and retest it or write down why it is acceptable for the specific beta build.

## 8. Review Release Documents

Before giving the app to testers, review:

- `docs/PRIVACY_POLICY.md`
- `docs/APP_STORE_METADATA.md`
- `docs/PROTOTYPE_STATUS.md`
- `docs/ONLINE_ROOM_SETUP.md`
- `docs/BETA_DEVICE_MATRIX.md`
- `docs/DEVICE_PASS_LOG.md`

The privacy policy must match the real data collected by the app. If analytics, crash reporting, payments, accounts, or persistent history are added, update the policy before release.

## 9. Tag The Build Decision

When all checks and device tests pass, record:

- git commit SHA
- Supabase project used
- app build number
- tester names
- device list
- known accepted limitations

This makes it possible to know exactly what was tested if a beta tester reports a bug later.

## Stop Conditions

Do not ship a beta build if:

- `npm run verify` fails
- `npm run check:online-room` fails
- the app cannot complete one full online game
- preview audio cannot be stopped reliably
- removed or closed-room users get stuck away from Home
- the privacy policy no longer matches implemented behavior
- production secrets are committed or exposed in app code
