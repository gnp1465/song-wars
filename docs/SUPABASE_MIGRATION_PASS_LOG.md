# Supabase Migration Pass Log

Use this file after applying migrations to a hosted Supabase project. The purpose is to prove which backend project was migrated, which SQL files were applied, and which hosted checks passed.

## Backend Setup

- Date:
- Applied by:
- Supabase project URL:
- Supabase project ref:
- Environment:
- SQL source command:
- Schema cache wait time:

## Migration Application

Mark each migration as `Pass`, `Fail`, or `Needs follow-up`.

| Migration | Result | Evidence |
| --- | --- | --- |
| `supabase/migrations/202607140001_online_room_lobby.sql` |  |  |
| `supabase/migrations/202607190001_online_round_topic.sql` |  |  |
| `supabase/migrations/202607190002_online_round_submissions.sql` |  |  |
| `supabase/migrations/202607190003_online_round_judging.sql` |  |  |
| `supabase/migrations/202607190004_online_game_reset.sql` |  |  |
| `supabase/migrations/202607210001_online_playback_events.sql` |  |  |

## Hosted Verification

Mark each check as `Pass`, `Fail`, or `Needs follow-up`.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run check:supabase-env` |  |  |
| `npm run check:online-room` |  |  |
| `CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room` |  |  |
| two-device lobby create/join |  |  |
| three-player online game start |  |  |
| full online game to final winner |  |  |

## Final Decision

- Supabase migration pass status:
- Remaining backend blockers:
- Notes:

If `npm run print:supabase-migrations:core` was used because Supabase rejected `realtime.messages` policy creation, note that here and keep the status incomplete until private Realtime Presence authorization is resolved.
