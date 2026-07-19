import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migrationPath = "supabase/migrations/202607140001_online_room_lobby.sql";
const migration = readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").toLowerCase();

const requiredSnippets = [
  "create table if not exists public.rooms",
  "create table if not exists public.room_members",
  "create table if not exists public.rounds",
  "code text unique",
  "constraint rooms_code_format check",
  "now() + interval '12 hours'",
  "check (songs_per_player between 1 and 3)",
  "check (points_to_win between 1 and 7)",
  "unique (room_id, user_id)",
  "create unique index if not exists room_members_unique_display_name",
  "alter table public.rooms enable row level security",
  "alter table public.room_members enable row level security",
  "alter table public.rounds enable row level security",
  "create policy \"room members can read rooms\"",
  "create policy \"room members can read members\"",
  "create policy \"room members can read rounds\"",
  "alter table realtime.messages enable row level security",
  "create policy \"room members can read room presence\"",
  "create policy \"room members can track room presence\"",
  "create or replace function public.create_room",
  "create or replace function public.join_room",
  "create or replace function public.leave_room",
  "create or replace function public.remove_room_member",
  "create or replace function public.update_room_settings",
  "create or replace function public.start_room",
  "create or replace function public.close_room",
  "create or replace function public.get_room_snapshot",
  "grant execute on function public.create_room",
  "grant execute on function public.join_room",
  "grant execute on function public.leave_room",
  "grant execute on function public.remove_room_member",
  "grant execute on function public.update_room_settings",
  "grant execute on function public.start_room",
  "grant execute on function public.close_room",
  "grant execute on function public.get_room_snapshot",
  "alter publication supabase_realtime add table public.rooms",
  "alter publication supabase_realtime add table public.room_members",
  "alter publication supabase_realtime add table public.rounds",
];

for (const snippet of requiredSnippets) {
  assert(
    migration.includes(snippet),
    `Expected ${migrationPath} to contain: ${snippet}`,
  );
}

assert(
  /if member_count >= 12 then/.test(migration),
  "join_room should reject a thirteenth room member.",
);
assert(
  /if member_count < 3 then/.test(migration),
  "start_room should require at least three room members.",
);
assert(
  /set status = 'in_round', code = null/.test(migration),
  "start_room should move the room into round state and clear the join code.",
);
assert(
  /'waiting_for_topic'/.test(migration),
  "start_room should create Round 1 in the waiting_for_topic state.",
);
assert(
  /public\.normalize_display_name\(display_name\) = public\.normalize_display_name\(guest_display_name\)/.test(
    migration,
  ),
  "join_room should block duplicate display names with normalized comparison.",
);
assert(
  /realtime\.messages\.extension = 'presence'/.test(migration),
  "private realtime room channels should authorize Presence messages.",
);

console.log("Online room schema checks passed.");
