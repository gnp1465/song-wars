# Online Room Setup

Use this guide to connect the online lobby to a hosted Supabase development project.

## 1. Create The Supabase Project

- Create a hosted Supabase project.
- Enable anonymous sign-ins in Supabase Auth.
- Copy the project URL and anon public key.

## 2. Configure The App

Create `.env` from `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never put a service role key in the mobile app.

For a later production build, copy `.env.production.example` to `.env.production` and point it at the production Supabase project. Keep development and production Supabase projects separate so beta tests cannot modify release data.

Check the local Supabase config before running the app:

```bash
npm run check:supabase-env
```

## 3. Apply The Migration

Apply every SQL file in `supabase/migrations` in filename order. The first migration creates the lobby foundation, and later migrations extend the online game flow.

```bash
supabase/migrations/202607140001_online_room_lobby.sql
supabase/migrations/202607190001_online_round_topic.sql
supabase/migrations/202607190002_online_round_submissions.sql
supabase/migrations/202607190003_online_round_judging.sql
supabase/migrations/202607190004_online_game_reset.sql
supabase/migrations/202607210001_online_playback_events.sql
```

This creates the `rooms`, `room_members`, `rounds`, `round_submissions`, `round_matchups`, and `room_scores` tables plus the RPC functions used by the app.

To print one ordered SQL block for the Supabase SQL editor, run:

```bash
npm run print:supabase-migrations
```

## 4. Verify The Hosted Backend

Run:

```bash
npm run check:online-room
```

This creates three separate anonymous host/guest clients and verifies:

- six-digit room-code creation
- wrong-code rejection
- case-insensitive duplicate display-name blocking
- direct table-write blocking through RLS
- nonmember snapshot blocking
- host-only settings, removals, and start
- minimum three-player start rule
- guest removal and voluntary leave access cleanup
- room close behavior
- Round 1 creation with the host as first judge
- judge-only topic submission
- topic locking after submission
- judge song-submission blocking
- duplicate song blocking inside a round
- own-submission removal while the round is still accepting songs
- automatic transition to judging after all required songs are submitted
- automatic bracket creation
- judge-only winner selection
- round winner scoring
- next-round creation with the round winner as judge
- final-game completion at the points-to-win target
- host-only Play Again reset
- host room closing after a game starts
- judge-only server-scheduled remote preview events
- join-code clearing after start

The script stores reusable test sessions in `.cache/online-room-check-sessions.json` so repeated checks do not create new anonymous users every time. That file contains temporary auth tokens and is ignored by git.

The twelve-player capacity check creates extra anonymous users, so it is opt-in to avoid Supabase auth rate limits during normal development:

```bash
CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room
```

After the hosted migration and backend checks pass, fill out `docs/SUPABASE_MIGRATION_PASS_LOG.md` with the Supabase project, migration results, and check evidence. Then run:

```bash
npm run check:supabase-migration-pass-log
```

That check is intentionally separate from `npm run verify` because it depends on real hosted Supabase evidence, not local code.

You can also run the local schema contract check without Supabase credentials:

```bash
npm run check:online-room-schema
```

That check reads the committed migration and confirms the expected online-room tables, RPC functions, RLS policies, Realtime Presence policies, and publication setup are still present.

You can verify that this setup guide lists the same migrations that exist on disk:

```bash
npm run check:supabase-migration-docs
```

If the hosted check says `Anonymous sign-ins are disabled`, open Supabase Auth settings and enable Anonymous Sign-ins before rerunning it.

If the hosted check says `Supabase anonymous auth rate limit reached`, wait for the rate-limit window to reset before rerunning it. The normal check creates four anonymous users; the optional capacity check creates more.

## 5. Device Test

Run the app on two phones or simulators:

- Create an online room on device A.
- Join with the six-digit code or QR code on device B.
- Confirm both devices see the same player list.
- Change settings as host and confirm the guest sees updates.
- Briefly background and reopen one device, then confirm it refetches the latest room state.
- Start with at least three players and confirm all devices transition to Round 1 setup.
- Submit a topic as judge and confirm all devices transition to song submissions.
- Submit songs from every non-judge and confirm all devices transition to judging.
- Pick matchup winners as judge and confirm contestants cannot pick winners.
- In Remote Sync mode, schedule a synced preview and confirm every device shows locked playback progress.
- Finish the bracket and confirm the round winner becomes the next judge.
- Finish a first-to-one game and confirm the host can Play Again.
