# Diagnostics

Diagnostics are messages that help developers understand app failures and important product events. For the current beta, Song Wars uses local console diagnostics only. There is no production crash-reporting or remote analytics SDK connected yet.

## Current Behavior

- React rendering crashes are caught by the root error boundary.
- Global audio-mode setup failures are reported through the diagnostics logger.
- Important local telemetry events, such as app start and resume-room availability, are reported through the same diagnostics service.
- Diagnostics are printed locally with `console.warn` for errors and `console.info` for events.
- Diagnostics are not intentionally sent to a third-party crash or analytics service.

## Local Telemetry Events

Telemetry means recording that something happened in the app. The current implementation supports local-only event records for beta debugging. These events are useful because later crash reporting or analytics can plug into one service instead of being scattered through screens.

Current event names live in `src/services/diagnostics/logger.ts` and include:

- `app_started`
- `audio_mode_configured`
- `online_room_resume_available`
- `online_room_resume_failed`

## Redaction

Before a diagnostic message is printed, `src/services/diagnostics/logger.ts` redacts common sensitive or noisy values:

- bearer tokens
- JWT-looking token strings
- query or form values named `access_token`, `refresh_token`, `token`, `apikey`, `api_key`, `anon_key`, `password`, `secret`, or `service_role`
- Supabase project URLs
- string metadata attached to local telemetry events
- metadata values whose keys look like tokens, passwords, secrets, or service-role keys

This does not replace careful privacy review. It is a guardrail that makes accidental local diagnostic output safer.

## Verification

Run:

```bash
npm run check:diagnostics
```

The full verification gate also runs this check:

```bash
npm run verify
```

## Later Crash Reporting

Before adding Sentry, Bugsnag, Firebase Crashlytics, Expo error reporting, or any remote analytics SDK:

- update `docs/PRIVACY_POLICY.md`
- update `docs/APP_STORE_METADATA.md`
- decide what user IDs or room IDs may be attached to events
- confirm no raw song search terms, preview URLs, access tokens, or service keys are sent
- add tests or configuration checks for the new provider
