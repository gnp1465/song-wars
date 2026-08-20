# Supabase Migration Pass Log

Use this file after applying migrations to a hosted Supabase project. The purpose is to prove which backend project was migrated, which SQL files were applied, and which hosted checks passed.

## Backend Setup

- Date: 2026-08-20
- Applied by: Gustavo Poleto
- Supabase project URL: `https://easekcfkdyxceokgplgx.supabase.co`
- Supabase project ref: `easekcfkdyxceokgplgx`
- Environment: Hosted Supabase development project
- SQL source command: `npm run print:supabase-migrations:core`
- Schema cache wait time: Completed before the successful hosted verification run

## Migration Application

Mark each migration as `Pass`, `Fail`, or `Needs follow-up`.

| Migration | Result | Evidence |
| --- | --- | --- |
| `supabase/migrations/202607140001_online_room_lobby.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607190001_online_round_topic.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607190002_online_round_submissions.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607190003_online_round_judging.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607190004_online_game_reset.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607210001_online_playback_events.sql` | Pass | Applied successfully in the hosted SQL editor. |
| `supabase/migrations/202607220001_online_member_leave_safety.sql` | Pass | Applied successfully and verified with active-game leave behavior. |
| `supabase/migrations/202607230001_online_next_round_host_only.sql` | Pass | Applied successfully and verified with host-only next-round behavior. |

## Hosted Verification

Mark each check as `Pass`, `Fail`, or `Needs follow-up`.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run check:supabase-env` | Pass | Local environment check passed. |
| `npm run check:online-room` | Pass | Hosted RPC, RLS, and game-flow verification passed. |
| `CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room` | Pass | Hosted capacity path passed. |
| two-device lobby create/join | Pass | Physical-device room join and Realtime sync passed. |
| three-player online game start | Pass | MacBook Pro simulator, iPhone 14, and iPad started together. |
| full online game to final winner | Pass | User completed the full three-device game flow successfully. |

## Final Decision

- Supabase migration pass status: Pass
- Remaining backend blockers: None
- Notes: The core migration bundle omitted private `realtime.messages` policy creation because the hosted project rejected owner-only table changes. Beta rooms use public Realtime channels for event delivery while RPC authorization and table RLS continue to protect game data.

If `npm run print:supabase-migrations:core` was used because Supabase rejected `realtime.messages` policy creation, note that here. The beta app uses public Realtime room channels for live updates, so private Presence authorization is a later hardening task rather than a blocker for the hosted backend pass.
