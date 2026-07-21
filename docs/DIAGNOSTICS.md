# Diagnostics

Diagnostics are messages that help developers understand app failures. For the current beta, Song Wars uses local console diagnostics only. There is no production crash-reporting or analytics SDK connected yet.

## Current Behavior

- React rendering crashes are caught by the root error boundary.
- Global audio-mode setup failures are reported through the diagnostics logger.
- Diagnostics are printed locally with `console.warn`.
- Diagnostics are not intentionally sent to a third-party crash service.

## Redaction

Before a diagnostic message is printed, `src/services/diagnostics/logger.ts` redacts common sensitive or noisy values:

- bearer tokens
- JWT-looking token strings
- query or form values named `access_token`, `refresh_token`, `token`, `apikey`, `api_key`, `anon_key`, `password`, `secret`, or `service_role`
- Supabase project URLs

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

Before adding Sentry, Bugsnag, Firebase Crashlytics, Expo error reporting, or any analytics SDK:

- update `docs/PRIVACY_POLICY.md`
- update `docs/APP_STORE_METADATA.md`
- decide what user IDs or room IDs may be attached to events
- confirm no raw song search terms, preview URLs, access tokens, or service keys are sent
- add tests or configuration checks for the new provider
