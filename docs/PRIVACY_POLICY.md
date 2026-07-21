# Song Wars Privacy Policy Draft

Last updated: July 21, 2026

Song Wars is a party game where players create or join temporary rooms, submit songs, preview audio, and vote through bracket-style battles.

This draft describes the current beta design. Review it before App Store submission, especially if analytics, crash reporting, accounts, payments, or persistent history are added later.

## Data We Use

Song Wars currently uses:

- Temporary display names entered by players.
- Anonymous Supabase user IDs created automatically by Supabase Auth.
- Temporary room data, including room codes, room settings, player membership, topics, song submissions, bracket matchups, scores, and playback events.
- Device-local storage for the last display name and last online room ID on the current app installation.
- Song search and preview metadata returned by music providers, currently Apple/iTunes preview search and app media abstractions.

Song Wars does not currently require visible account creation, email addresses, phone numbers, passwords, contacts, precise GPS location, or payment information.

## Diagnostics

Song Wars currently uses local console diagnostics for app errors. It does not intentionally send crash reports or analytics events to a third-party service yet. Local diagnostic messages are redacted for common token-like values before printing. See `docs/DIAGNOSTICS.md` for the current diagnostic behavior.

## Why We Use This Data

We use this data to:

- Create and join temporary multiplayer rooms.
- Keep player lists, room settings, submissions, judging, and scores synchronized.
- Let players resume the most recent online room on the same device.
- Resolve playable in-app song previews.
- Keep online rooms temporary and expire them after the configured room lifetime.

## Anonymous Sessions

Hosts and guests receive anonymous Supabase sessions automatically. These sessions create real backend user IDs so the database can enforce room permissions.

If the app is deleted, local session storage may be lost. In the current beta, old anonymous rooms are not recoverable across devices or fresh installs.

## Music Providers

Song Wars uses external music APIs to search for songs and resolve preview audio. Search terms and related request metadata may be processed by those providers according to their own policies.

Song Wars does not currently stream full songs. The product is built around short preview playback.

## Data Sharing

Room data is shared with other players in the same room so the game can work. Nonmembers should not be able to read private room state because Supabase Row Level Security policies restrict access.

Song Wars does not currently sell user data.

## Data Retention

Online rooms are temporary party sessions. Lobby rooms expire after 12 hours under the current backend design. Later product versions may add persistent history only after the product decision is explicitly made.

Local device storage can be cleared by deleting the app.

## Children

Song Wars is not currently designed for children under 13. If the target audience changes, the privacy policy and App Store configuration must be revisited.

## Future Changes

Later versions may add optional accounts, analytics, crash reporting, paid features, persistent history, friend groups, or additional music providers. If those features ship, this policy must be updated before release.

## Contact

For questions about this policy, contact the Song Wars project owner.
