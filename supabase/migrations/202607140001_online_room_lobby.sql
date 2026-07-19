create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  host_user_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby', 'in_round', 'closed', 'expired')),
  mode text not null default 'single_speaker' check (mode in ('single_speaker', 'remote')),
  songs_per_player integer not null default 1 check (songs_per_player between 1 and 3),
  points_to_win integer not null default 3 check (points_to_win between 1 and 7),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '12 hours',
  constraint rooms_code_format check (code is null or code ~ '^[0-9]{6}$')
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  display_name text not null check (length(trim(display_name)) between 1 and 32),
  role text not null check (role in ('host', 'guest')),
  join_order integer not null,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, join_order)
);

create unique index if not exists room_members_unique_display_name
  on public.room_members (room_id, lower(trim(display_name)));

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  judge_member_id uuid not null references public.room_members(id) on delete restrict,
  status text not null default 'waiting_for_topic' check (status in ('waiting_for_topic')),
  created_at timestamptz not null default now(),
  unique (room_id, round_number)
);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.rounds enable row level security;

create or replace function public.is_room_member(room_id_value uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = room_id_value
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_room_host(room_id_value uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms
    where id = room_id_value
      and host_user_id = auth.uid()
      and status = 'lobby'
  );
$$;

create or replace function public.online_room_id_from_realtime_topic()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  topic_value text := realtime.topic();
begin
  if topic_value !~ '^online-room:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return null;
  end if;

  return split_part(topic_value, ':', 2)::uuid;
end;
$$;

drop policy if exists "room members can read rooms" on public.rooms;
create policy "room members can read rooms"
  on public.rooms
  for select
  using (public.is_room_member(id));

drop policy if exists "room members can read members" on public.room_members;
create policy "room members can read members"
  on public.room_members
  for select
  using (public.is_room_member(room_id));

drop policy if exists "room members can read rounds" on public.rounds;
create policy "room members can read rounds"
  on public.rounds
  for select
  using (public.is_room_member(room_id));

drop policy if exists "room members can read room presence" on realtime.messages;
create policy "room members can read room presence"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'presence'
    and public.is_room_member(public.online_room_id_from_realtime_topic())
  );

drop policy if exists "room members can track room presence" on realtime.messages;
create policy "room members can track room presence"
  on realtime.messages
  for insert
  to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and public.is_room_member(public.online_room_id_from_realtime_topic())
  );

create or replace function public.normalize_display_name(display_name_value text)
returns text
language sql
immutable
as $$
  select lower(trim(display_name_value));
$$;

create or replace function public.generate_room_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
  attempts integer := 0;
begin
  loop
    generated_code := lpad(floor(random() * 1000000)::text, 6, '0');
    attempts := attempts + 1;

    exit when not exists (
      select 1
      from public.rooms
      where code = generated_code
        and status = 'lobby'
        and expires_at > now()
    );

    if attempts > 25 then
      raise exception 'Could not generate a unique room code.';
    end if;
  end loop;

  return generated_code;
end;
$$;

create or replace function public.expire_stale_rooms()
returns void
language sql
security definer
set search_path = public
as $$
  update public.rooms
  set status = 'expired',
      code = null
  where status = 'lobby'
    and expires_at <= now();
$$;

create or replace function public.build_room_snapshot(room_id_value uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'room', to_jsonb(r.*),
    'members', coalesce(
      (
        select jsonb_agg(to_jsonb(m.*) order by m.join_order)
        from public.room_members m
        where m.room_id = r.id
      ),
      '[]'::jsonb
    ),
    'presence', '[]'::jsonb,
    'current_round', (
      select to_jsonb(rd.*)
      from public.rounds rd
      where rd.room_id = r.id
      order by rd.round_number desc
      limit 1
    )
  )
  from public.rooms r
  where r.id = room_id_value;
$$;

create or replace function public.get_room_snapshot(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.expire_stale_rooms();

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_room_member(room_id_value) then
    raise exception 'You are not a member of this room.';
  end if;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.create_room(
  host_display_name text,
  room_mode text,
  songs_per_player_value integer,
  points_to_win_value integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_room_id uuid;
begin
  perform public.expire_stale_rooms();

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  insert into public.rooms (
    code,
    host_user_id,
    mode,
    songs_per_player,
    points_to_win
  )
  values (
    public.generate_room_code(),
    auth.uid(),
    room_mode,
    songs_per_player_value,
    points_to_win_value
  )
  returning id into new_room_id;

  insert into public.room_members (
    room_id,
    user_id,
    display_name,
    role,
    join_order
  )
  values (
    new_room_id,
    auth.uid(),
    trim(host_display_name),
    'host',
    1
  );

  return public.build_room_snapshot(new_room_id);
end;
$$;

create or replace function public.join_room(room_code text, guest_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  member_count integer;
  next_join_order integer;
begin
  perform public.expire_stale_rooms();

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into target_room
  from public.rooms
  where code = trim(room_code)
    and status = 'lobby'
    and expires_at > now()
  limit 1;

  if target_room.id is null then
    raise exception 'Room code is invalid or expired.';
  end if;

  select count(*)
  into member_count
  from public.room_members
  where room_id = target_room.id;

  if member_count >= 12 then
    raise exception 'This room is full.';
  end if;

  if exists (
    select 1
    from public.room_members
    where room_id = target_room.id
      and public.normalize_display_name(display_name) = public.normalize_display_name(guest_display_name)
  ) then
    raise exception 'A player with that name is already in the room.';
  end if;

  select coalesce(max(join_order), 0) + 1
  into next_join_order
  from public.room_members
  where room_id = target_room.id;

  insert into public.room_members (
    room_id,
    user_id,
    display_name,
    role,
    join_order
  )
  values (
    target_room.id,
    auth.uid(),
    trim(guest_display_name),
    'guest',
    next_join_order
  );

  return public.build_room_snapshot(target_room.id);
end;
$$;

create or replace function public.leave_room(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  delete from public.room_members
  where room_id = room_id_value
    and user_id = auth.uid()
    and role = 'guest';

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.remove_room_member(room_id_value uuid, member_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(room_id_value) then
    raise exception 'Only the host can remove players.';
  end if;

  delete from public.room_members
  where room_id = room_id_value
    and id = member_id_value
    and role = 'guest';

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.update_room_settings(
  room_id_value uuid,
  room_mode text,
  songs_per_player_value integer,
  points_to_win_value integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(room_id_value) then
    raise exception 'Only the host can update room settings.';
  end if;

  update public.rooms
  set mode = coalesce(room_mode, mode),
      songs_per_player = coalesce(songs_per_player_value, songs_per_player),
      points_to_win = coalesce(points_to_win_value, points_to_win)
  where id = room_id_value
    and status = 'lobby';

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.start_room(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  member_count integer;
  host_member_id uuid;
begin
  if not public.is_room_host(room_id_value) then
    raise exception 'Only the host can start this room.';
  end if;

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  for update;

  if target_room.status <> 'lobby' then
    raise exception 'Room is not in the lobby.';
  end if;

  select count(*)
  into member_count
  from public.room_members
  where room_id = room_id_value;

  if member_count < 3 then
    raise exception 'At least 3 players are required to start.';
  end if;

  select id
  into host_member_id
  from public.room_members
  where room_id = room_id_value
    and user_id = target_room.host_user_id
    and role = 'host'
  limit 1;

  insert into public.rounds (
    room_id,
    round_number,
    judge_member_id,
    status
  )
  values (
    room_id_value,
    1,
    host_member_id,
    'waiting_for_topic'
  )
  on conflict (room_id, round_number) do nothing;

  update public.rooms
  set status = 'in_round',
      code = null
  where id = room_id_value;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.close_room(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_room_host(room_id_value) then
    raise exception 'Only the host can close this room.';
  end if;

  update public.rooms
  set status = 'closed',
      code = null
  where id = room_id_value;

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.create_room(text, text, integer, integer) to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.remove_room_member(uuid, uuid) to authenticated;
grant execute on function public.update_room_settings(uuid, text, integer, integer) to authenticated;
grant execute on function public.start_room(uuid) to authenticated;
grant execute on function public.close_room(uuid) to authenticated;
grant execute on function public.get_room_snapshot(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'rooms'
    ) then
      alter publication supabase_realtime add table public.rooms;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'room_members'
    ) then
      alter publication supabase_realtime add table public.room_members;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'rounds'
    ) then
      alter publication supabase_realtime add table public.rounds;
    end if;
  end if;
end;
$$;
