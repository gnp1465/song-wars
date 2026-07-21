# Song Wars App Store Metadata Draft

Last updated: July 21, 2026

This draft is for a future iOS beta/App Store listing. Review before submission, especially after final device testing, privacy review, and production Supabase setup.

## App Name

Song Wars

## Subtitle

Battle friends with song previews

## Short Description

Create a room, pick a topic, submit songs, preview the matchups, and judge each bracket until one player wins.

## Full Description Draft

Song Wars is a party music battle game for friends.

Start a local game or create an online room, choose a topic like beach vibes or late-night drive, then let players submit songs that match the prompt. Song Wars builds the submissions into a bracket, plays in-app previews, and keeps score as judges pick winners.

Current beta highlights:

- Local party mode.
- Anonymous online rooms.
- Six-digit room codes and QR invite links.
- In-app song preview playback.
- Topic setup, song submissions, bracket judging, scoring, and final winner flow.
- Remote Sync preview controls for shared listening tests.

No visible account creation is required for the first multiplayer beta.

## Keywords Draft

music game, party game, song battle, music bracket, playlist game, friends, trivia, aux, judge

## Category Draft

Games

## Age Rating Notes

Song Wars can surface song titles, artist names, album artwork, and preview audio from external music providers. Review App Store age-rating questions using the final provider behavior before submission.

## Privacy Summary Draft

Song Wars currently uses anonymous Supabase sessions, temporary display names, temporary room data, and music-provider search/preview metadata. It does not currently require visible accounts, email addresses, phone numbers, contacts, precise GPS location, or payment information.

Use `docs/PRIVACY_POLICY.md` as the detailed policy draft.

## Review Notes Draft

Online rooms require Supabase configuration. Testers can use Local Game without a backend. For online testing, create a room on one device, join from another device using the six-digit code or QR invite, then submit a topic and songs to reach bracket judging.

## Release Blockers Before Submission

- Hosted production Supabase project created.
- Latest migrations applied to production Supabase.
- `npm run check:online-room` passes against the intended backend.
- iOS device pass completed and recorded in `docs/DEVICE_PASS_LOG.md`.
- Privacy policy reviewed against final analytics/crash-reporting/account/payment decisions.
- App icon/splash reviewed on device.
