create table if not exists public.round_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  member_id uuid not null references public.room_members(id) on delete cascade,
  song_key text not null,
  track_id text not null,
  title text not null check (length(trim(title)) between 1 and 160),
  artists text[] not null default '{}',
  album_name text,
  artwork_url text,
  preview_url text,
  provider_refs jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  unique (round_id, song_key),
  unique (round_id, member_id, song_key)
);

alter table public.round_submissions enable row level security;

drop policy if exists "room members can read submissions" on public.round_submissions;
create policy "room members can read submissions"
  on public.round_submissions
  for select
  using (public.is_room_member(room_id));

create or replace function public.normalize_song_key(title_value text, artists_value text[])
returns text
language sql
immutable
as $$
  select lower(trim(title_value)) || ':' || array_to_string(
    array(
      select lower(trim(artist_value))
      from unnest(artists_value) as artist_value
    ),
    ','
  );
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
    ),
    'submissions', coalesce(
      (
        select jsonb_agg(to_jsonb(s.*) order by s.submitted_at)
        from public.round_submissions s
        where s.room_id = r.id
          and s.round_id = (
            select rd.id
            from public.rounds rd
            where rd.room_id = r.id
            order by rd.round_number desc
            limit 1
          )
      ),
      '[]'::jsonb
    )
  )
  from public.rooms r
  where r.id = room_id_value;
$$;

create or replace function public.submit_round_song(
  room_id_value uuid,
  track_id_value text,
  title_value text,
  artists_value text[],
  album_name_value text,
  artwork_url_value text,
  preview_url_value text,
  provider_refs_value jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_round record;
  current_member record;
  member_submission_count integer;
  required_submission_count integer;
  current_submission_count integer;
  normalized_song_key text := public.normalize_song_key(title_value, artists_value);
begin
  perform public.expire_stale_rooms();

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into current_member
  from public.room_members
  where room_id = room_id_value
    and user_id = auth.uid()
  limit 1;

  if current_member.id is null then
    raise exception 'You are not a member of this room.';
  end if;

  select rd.*, r.songs_per_player
  into active_round
  from public.rounds rd
  join public.rooms r on r.id = rd.room_id
  where rd.room_id = room_id_value
    and r.status = 'in_round'
  order by rd.round_number desc
  limit 1
  for update of rd;

  if active_round.id is null then
    raise exception 'No active round exists for this room.';
  end if;

  if active_round.status <> 'submitting' then
    raise exception 'This round is not accepting submissions.';
  end if;

  if current_member.id = active_round.judge_member_id then
    raise exception 'The judge cannot submit songs.';
  end if;

  if length(trim(title_value)) < 1 then
    raise exception 'Song title is required.';
  end if;

  if coalesce(cardinality(artists_value), 0) < 1 then
    raise exception 'At least one artist is required.';
  end if;

  if length(trim(coalesce(preview_url_value, ''))) < 1 then
    raise exception 'A playable preview is required.';
  end if;

  select count(*)
  into member_submission_count
  from public.round_submissions
  where round_id = active_round.id
    and member_id = current_member.id;

  if member_submission_count >= active_round.songs_per_player then
    raise exception 'You have already submitted the required number of songs.';
  end if;

  if exists (
    select 1
    from public.round_submissions
    where round_id = active_round.id
      and song_key = normalized_song_key
  ) then
    raise exception 'That song has already been submitted for this round.';
  end if;

  insert into public.round_submissions (
    room_id,
    round_id,
    member_id,
    song_key,
    track_id,
    title,
    artists,
    album_name,
    artwork_url,
    preview_url,
    provider_refs
  )
  values (
    room_id_value,
    active_round.id,
    current_member.id,
    normalized_song_key,
    track_id_value,
    trim(title_value),
    artists_value,
    nullif(trim(album_name_value), ''),
    nullif(trim(artwork_url_value), ''),
    nullif(trim(preview_url_value), ''),
    coalesce(provider_refs_value, '[]'::jsonb)
  );

  select count(*)
  into current_submission_count
  from public.round_submissions
  where round_id = active_round.id;

  select (count(*) - 1) * active_round.songs_per_player
  into required_submission_count
  from public.room_members
  where room_id = room_id_value;

  if current_submission_count >= required_submission_count then
    update public.rounds
    set status = 'judging'
    where id = active_round.id;
  end if;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.remove_own_submission(room_id_value uuid, submission_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_round record;
  current_member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select id
  into current_member_id
  from public.room_members
  where room_id = room_id_value
    and user_id = auth.uid()
  limit 1;

  if current_member_id is null then
    raise exception 'You are not a member of this room.';
  end if;

  select rd.*
  into active_round
  from public.rounds rd
  where rd.room_id = room_id_value
  order by rd.round_number desc
  limit 1
  for update;

  if active_round.status <> 'submitting' then
    raise exception 'Submissions can only be removed while the round is accepting submissions.';
  end if;

  delete from public.round_submissions
  where id = submission_id_value
    and room_id = room_id_value
    and round_id = active_round.id
    and member_id = current_member_id;

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.submit_round_song(uuid, text, text, text[], text, text, text, jsonb) to authenticated;
grant execute on function public.remove_own_submission(uuid, uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'round_submissions'
    ) then
      alter publication supabase_realtime add table public.round_submissions;
    end if;
  end if;
end;
$$;
