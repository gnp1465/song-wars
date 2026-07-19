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

## 3. Apply The Migration

Apply:

```bash
supabase/migrations/202607140001_online_room_lobby.sql
```

This creates the `rooms`, `room_members`, and `rounds` tables plus the RPC functions used by the app.

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
- join-code clearing after start

The twelve-player capacity check creates extra anonymous users, so it is opt-in to avoid Supabase auth rate limits during normal development:

```bash
CHECK_ONLINE_ROOM_CAPACITY=1 npm run check:online-room
```

You can also run the local schema contract check without Supabase credentials:

```bash
npm run check:online-room-schema
```

That check reads the committed migration and confirms the expected online-room tables, RPC functions, RLS policies, Realtime Presence policies, and publication setup are still present.

If the hosted check says `Anonymous sign-ins are disabled`, open Supabase Auth settings and enable Anonymous Sign-ins before rerunning it.

If the hosted check says `Supabase anonymous auth rate limit reached`, wait for the rate-limit window to reset before rerunning it. The normal check creates four anonymous users; the optional capacity check creates more.

## 5. Device Test

Run the app on two phones or simulators:

- Create an online room on device A.
- Join with the six-digit code on device B.
- Confirm both devices see the same player list.
- Change settings as host and confirm the guest sees updates.
- Start with at least three players and confirm all devices transition to Round 1 setup.
