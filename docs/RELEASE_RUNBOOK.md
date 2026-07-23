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

The migration catches Supabase `realtime.messages` ownership errors and prints a notice instead of aborting the rest of the backend setup. If the dashboard still fails with `ERROR: 42501: must be owner of table messages`, use `npm run print:supabase-migrations:core` to apply the core game schema without the private Presence policy statements. The beta app uses public Realtime room channels for live updates, while room data and game actions remain protected by RPC functions and RLS.

If a hosted check reports one missing RPC after a partial migration attempt, print the relevant individual migration with `npm run print:supabase-migration -- <migration-file.sql>`. Prefer the full ordered migration command for fresh projects.

After applying migrations, wait briefly for Supabase's schema cache to refresh before running hosted checks.

Record the hosted migration pass in `docs/SUPABASE_MIGRATION_PASS_LOG.md`. This is the checklist that proves which Supabase project was migrated and which hosted checks passed.

## 4. Run Automated Checks

Run the full local gate:

```bash
npm run verify
```

This includes `npm run check:secret-safety`, which confirms committed files do not contain tracked env files or Supabase JWT-like keys.
It also includes `npm run check:ci-config`, which confirms the GitHub Actions workflow runs the same verification gate on pushes and pull requests.
It also includes `npm run check:doc-links`, which confirms local README and documentation links still point to real files.

Run the hosted backend smoke check:

```bash
npm run check:online-room
```

Run the optional capacity check when Supabase auth rate limits are not a concern:

```bash
CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room
```

After the hosted checks pass and the migration pass log is filled out, run:

```bash
npm run check:supabase-migration-pass-log
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

## 6. Confirm Build Profiles

Check the committed EAS build profiles:

```bash
npm run check:eas-build-config
```

Use these profiles:

- `preview` for internal physical-device beta builds.
- `preview-simulator` for simulator builds.
- `production` for App Store/TestFlight release builds after the beta gates pass.

Do not run a production build until hosted Supabase checks, privacy review, and the device matrix are complete.

## 7. Run Device Matrix

Use `docs/BETA_DEVICE_MATRIX.md` to choose devices and scenarios. At minimum, test:

- one recent physical iPhone
- one older supported physical iPhone
- at least two devices in one online room
- at least three total players in one online game
- speaker audio, Bluetooth audio, and silent-switch behavior
- Wi-Fi and cellular or hotspot behavior

Record results in `docs/DEVICE_PASS_LOG.md`.

## 8. Confirm Device Evidence

After filling out the pass log, run:

```bash
npm run check:device-pass-log
```

Then run the final prototype completion gate:

```bash
npm run check:prototype-complete
```

If a row is marked `Fail` or `Needs follow-up`, either fix the issue and retest it or write down why it is acceptable for the specific beta build.

## 9. Review Release Documents

Before giving the app to testers, review:

- `docs/PRIVACY_POLICY.md`
- `docs/APP_STORE_METADATA.md`
- `docs/PROTOTYPE_STATUS.md`
- `docs/ONLINE_ROOM_SETUP.md`
- `docs/SUPABASE_MIGRATION_PASS_LOG.md`
- `docs/BETA_DEVICE_MATRIX.md`
- `docs/DEVICE_PASS_LOG.md`

The privacy policy must match the real data collected by the app. If analytics, crash reporting, payments, accounts, or persistent history are added, update the policy before release.

## 10. Tag The Build Decision

When all checks and device tests pass, record:

- git commit SHA
- Supabase project used
- app build number
- tester names
- device list
- known accepted limitations

Use `docs/BETA_BUILD_RECORD.md` for this record. After filling it out, run:

```bash
npm run check:beta-build-record
```

This makes it possible to know exactly what was tested if a beta tester reports a bug later.
The beta build record must include evidence for the Supabase migration pass log, because `npm run check:online-room` proves behavior only after the hosted project has the expected schema.

## Stop Conditions

Do not ship a beta build if:

- `npm run verify` fails
- `npm run check:online-room` fails
- `npm run check:supabase-migration-pass-log` fails
- the app cannot complete one full online game
- preview audio cannot be stopped reliably
- removed or closed-room users get stuck away from Home
- the privacy policy no longer matches implemented behavior
- production secrets are committed or exposed in app code
