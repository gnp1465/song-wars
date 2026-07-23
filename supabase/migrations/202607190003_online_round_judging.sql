alter table public.rooms
  add column if not exists game_winner_member_id uuid references public.room_members(id) on delete set null;

do $$
declare
  existing_constraint_name text;
begin
  select conname
  into existing_constraint_name
  from pg_constraint
  where conrelid = 'public.rooms'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if existing_constraint_name is not null then
    execute format('alter table public.rooms drop constraint %I', existing_constraint_name);
  end if;
end;
$$;

alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'in_round', 'complete', 'closed', 'expired'));

alter table public.rounds
  add column if not exists winning_submission_id uuid references public.round_submissions(id) on delete set null,
  add column if not exists winning_member_id uuid references public.room_members(id) on delete set null;

create table if not exists public.room_scores (
  room_id uuid not null references public.rooms(id) on delete cascade,
  member_id uuid not null references public.room_members(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (room_id, member_id)
);

create table if not exists public.round_matchups (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  bracket_round_number integer not null check (bracket_round_number > 0),
  position integer not null check (position > 0),
  status text not null default 'pending' check (status in ('pending', 'ready', 'complete')),
  left_submission_id uuid references public.round_submissions(id) on delete set null,
  right_submission_id uuid references public.round_submissions(id) on delete set null,
  winner_submission_id uuid references public.round_submissions(id) on delete set null,
  has_bye boolean not null default false,
  created_at timestamptz not null default now(),
  unique (round_id, bracket_round_number, position)
);

alter table public.room_scores enable row level security;
alter table public.round_matchups enable row level security;

drop policy if exists "room members can read scores" on public.room_scores;
create policy "room members can read scores"
  on public.room_scores
  for select
  using (public.is_room_member(room_id));

drop policy if exists "room members can read matchups" on public.round_matchups;
create policy "room members can read matchups"
  on public.round_matchups
  for select
  using (public.is_room_member(room_id));

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
    ),
    'matchups', coalesce(
      (
        select jsonb_agg(to_jsonb(mu.*) order by mu.bracket_round_number, mu.position)
        from public.round_matchups mu
        where mu.room_id = r.id
          and mu.round_id = (
            select rd.id
            from public.rounds rd
            where rd.room_id = r.id
            order by rd.round_number desc
            limit 1
          )
      ),
      '[]'::jsonb
    ),
    'scores', coalesce(
      (
        select jsonb_agg(to_jsonb(sc.*) order by m.join_order)
        from public.room_scores sc
        join public.room_members m on m.id = sc.member_id
        where sc.room_id = r.id
      ),
      '[]'::jsonb
    )
  )
  from public.rooms r
  where r.id = room_id_value;
$$;

create or replace function public.create_round_bracket_for_round(round_id_value uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_round record;
  ordered_submission_ids uuid[];
  remaining_submission_ids uuid[];
  submission_count integer;
  bracket_size integer := 1;
  bye_count integer;
  position_value integer := 1;
  left_id uuid;
  left_member_id uuid;
  right_id uuid;
  right_index integer;
  index_value integer;
begin
  select rd.*
  into target_round
  from public.rounds rd
  where rd.id = round_id_value
  limit 1;

  if target_round.id is null then
    raise exception 'Round does not exist.';
  end if;

  if exists (
    select 1
    from public.round_matchups
    where round_id = round_id_value
  ) then
    return;
  end if;

  select array_agg(s.id order by md5(s.id::text || ':' || round_id_value::text))
  into ordered_submission_ids
  from public.round_submissions s
  where s.round_id = round_id_value;

  submission_count := coalesce(array_length(ordered_submission_ids, 1), 0);

  if submission_count < 2 then
    raise exception 'At least two submissions are required to create a bracket.';
  end if;

  while bracket_size < submission_count loop
    bracket_size := bracket_size * 2;
  end loop;

  bye_count := bracket_size - submission_count;

  if bye_count > 0 then
    for index_value in 1..bye_count loop
      left_id := ordered_submission_ids[index_value];

      insert into public.round_matchups (
        room_id,
        round_id,
        bracket_round_number,
        position,
        status,
        left_submission_id,
        winner_submission_id,
        has_bye
      )
      values (
        target_round.room_id,
        target_round.id,
        1,
        position_value,
        'complete',
        left_id,
        left_id,
        true
      );

      position_value := position_value + 1;
    end loop;
  end if;

  remaining_submission_ids := coalesce(
    ordered_submission_ids[(bye_count + 1):submission_count],
    '{}'::uuid[]
  );

  while coalesce(array_length(remaining_submission_ids, 1), 0) > 0 loop
    left_id := remaining_submission_ids[1];
    remaining_submission_ids := coalesce(
      remaining_submission_ids[2:array_length(remaining_submission_ids, 1)],
      '{}'::uuid[]
    );
    right_id := null;
    right_index := null;

    select member_id
    into left_member_id
    from public.round_submissions
    where id = left_id;

    if coalesce(array_length(remaining_submission_ids, 1), 0) > 0 then
      select candidate_id, candidate_position
      into right_id, right_index
      from unnest(remaining_submission_ids) with ordinality as candidates(candidate_id, candidate_position)
      join public.round_submissions s on s.id = candidates.candidate_id
      where s.member_id <> left_member_id
      order by candidate_position
      limit 1;

      if right_id is null then
        right_id := remaining_submission_ids[1];
      end if;

      remaining_submission_ids := array_remove(remaining_submission_ids, right_id);
    end if;

    insert into public.round_matchups (
      room_id,
      round_id,
      bracket_round_number,
      position,
      status,
      left_submission_id,
      right_submission_id,
      winner_submission_id,
      has_bye
    )
    values (
      target_round.room_id,
      target_round.id,
      1,
      position_value,
      case when right_id is null then 'complete' else 'ready' end,
      left_id,
      right_id,
      case when right_id is null then left_id else null end,
      right_id is null
    );

    position_value := position_value + 1;
  end loop;
end;
$$;

create or replace function public.create_round_bracket(room_id_value uuid)
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
  join public.rooms r on r.id = rd.room_id
  where rd.room_id = room_id_value
    and r.status = 'in_round'
  order by rd.round_number desc
  limit 1;

  if active_round.id is null then
    raise exception 'No active round exists for this room.';
  end if;

  if active_round.status <> 'judging' then
    raise exception 'This round is not ready for bracket creation.';
  end if;

  if current_member_id <> active_round.judge_member_id then
    raise exception 'Only the judge can create the bracket.';
  end if;

  perform public.create_round_bracket_for_round(active_round.id);

  return public.build_room_snapshot(room_id_value);
end;
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

    perform public.create_round_bracket_for_round(active_round.id);
  end if;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.select_matchup_winner(
  room_id_value uuid,
  matchup_id_value uuid,
  winner_submission_id_value uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_round record;
  current_member_id uuid;
  target_matchup record;
  incomplete_matchup_count integer;
  winner_submission_ids uuid[];
  winner_count integer;
  winner_member_id uuid;
  winner_points integer;
  next_round_number integer;
  next_position integer := 1;
  index_value integer := 1;
  left_id uuid;
  right_id uuid;
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

  select rd.*, r.points_to_win
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

  if active_round.status <> 'judging' then
    raise exception 'This round is not being judged.';
  end if;

  if current_member_id <> active_round.judge_member_id then
    raise exception 'Only the judge can pick matchup winners.';
  end if;

  select *
  into target_matchup
  from public.round_matchups
  where id = matchup_id_value
    and room_id = room_id_value
    and round_id = active_round.id
  limit 1
  for update;

  if target_matchup.id is null then
    raise exception 'Matchup does not exist.';
  end if;

  if target_matchup.status <> 'ready' then
    raise exception 'This matchup is not ready for judging.';
  end if;

  if winner_submission_id_value <> target_matchup.left_submission_id
    and winner_submission_id_value <> target_matchup.right_submission_id then
    raise exception 'Winner must be one of the matchup songs.';
  end if;

  update public.round_matchups
  set status = 'complete',
      winner_submission_id = winner_submission_id_value
  where id = target_matchup.id;

  select count(*)
  into incomplete_matchup_count
  from public.round_matchups
  where round_id = active_round.id
    and bracket_round_number = target_matchup.bracket_round_number
    and status <> 'complete';

  if incomplete_matchup_count > 0 then
    return public.build_room_snapshot(room_id_value);
  end if;

  select array_agg(winner_submission_id order by position)
  into winner_submission_ids
  from public.round_matchups
  where round_id = active_round.id
    and bracket_round_number = target_matchup.bracket_round_number;

  winner_count := coalesce(array_length(winner_submission_ids, 1), 0);

  if winner_count = 1 then
    select member_id
    into winner_member_id
    from public.round_submissions
    where id = winner_submission_ids[1];

    insert into public.room_scores (room_id, member_id, points)
    values (room_id_value, winner_member_id, 1)
    on conflict (room_id, member_id) do update
    set points = public.room_scores.points + 1,
        updated_at = now()
    returning points into winner_points;

    update public.rounds
    set status = 'complete',
        winning_submission_id = winner_submission_ids[1],
        winning_member_id = winner_member_id
    where id = active_round.id;

    if winner_points >= active_round.points_to_win then
      update public.rooms
      set status = 'complete',
          game_winner_member_id = winner_member_id,
          code = null
      where id = room_id_value;
    end if;

    return public.build_room_snapshot(room_id_value);
  end if;

  next_round_number := target_matchup.bracket_round_number + 1;

  while index_value <= winner_count loop
    left_id := winner_submission_ids[index_value];
    right_id := winner_submission_ids[index_value + 1];

    insert into public.round_matchups (
      room_id,
      round_id,
      bracket_round_number,
      position,
      status,
      left_submission_id,
      right_submission_id,
      winner_submission_id,
      has_bye
    )
    values (
      room_id_value,
      active_round.id,
      next_round_number,
      next_position,
      case when right_id is null then 'complete' else 'ready' end,
      left_id,
      right_id,
      case when right_id is null then left_id else null end,
      right_id is null
    );

    next_position := next_position + 1;
    index_value := index_value + 2;
  end loop;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.complete_round(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_round record;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_room_member(room_id_value) then
    raise exception 'You are not a member of this room.';
  end if;

  select *
  into active_round
  from public.rounds
  where room_id = room_id_value
  order by round_number desc
  limit 1;

  if active_round.status <> 'complete' then
    raise exception 'The round is not complete yet.';
  end if;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.prepare_next_round(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  active_round record;
  current_member record;
begin
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

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  for update;

  if target_room.status <> 'in_round' then
    raise exception 'This room is not ready for another round.';
  end if;

  select *
  into active_round
  from public.rounds
  where room_id = room_id_value
  order by round_number desc
  limit 1
  for update;

  if active_round.status <> 'complete' then
    raise exception 'The current round is not complete.';
  end if;

  if active_round.winning_member_id is null then
    raise exception 'The round winner is missing.';
  end if;

  if current_member.id <> active_round.winning_member_id
    and current_member.user_id <> target_room.host_user_id then
    raise exception 'Only the host or next judge can start the next round.';
  end if;

  insert into public.rounds (
    room_id,
    round_number,
    judge_member_id,
    status
  )
  values (
    room_id_value,
    active_round.round_number + 1,
    active_round.winning_member_id,
    'waiting_for_topic'
  );

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.complete_game(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  winning_score record;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_room_member(room_id_value) then
    raise exception 'You are not a member of this room.';
  end if;

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  for update;

  select *
  into winning_score
  from public.room_scores
  where room_id = room_id_value
    and points >= target_room.points_to_win
  order by points desc, updated_at asc
  limit 1;

  if winning_score.member_id is null then
    raise exception 'No player has reached the win condition.';
  end if;

  update public.rooms
  set status = 'complete',
      game_winner_member_id = winning_score.member_id,
      code = null
  where id = room_id_value;

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.create_round_bracket(uuid) to authenticated;
grant execute on function public.select_matchup_winner(uuid, uuid, uuid) to authenticated;
grant execute on function public.complete_round(uuid) to authenticated;
grant execute on function public.prepare_next_round(uuid) to authenticated;
grant execute on function public.complete_game(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'round_matchups'
    ) then
      alter publication supabase_realtime add table public.round_matchups;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'room_scores'
    ) then
      alter publication supabase_realtime add table public.room_scores;
    end if;
  end if;
end;
$$;
