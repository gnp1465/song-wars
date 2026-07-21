create table if not exists public.room_playback_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  matchup_id uuid not null references public.round_matchups(id) on delete cascade,
  submission_id uuid not null references public.round_submissions(id) on delete cascade,
  created_by_member_id uuid not null references public.room_members(id) on delete cascade,
  track_id text not null,
  title text not null,
  preview_url text not null,
  duration_ms integer not null default 30000 check (duration_ms between 1000 and 120000),
  server_start_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.room_playback_events enable row level security;

drop policy if exists "room members can read playback events" on public.room_playback_events;
create policy "room members can read playback events"
  on public.room_playback_events
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
    ),
    'playback_events', coalesce(
      (
        select jsonb_agg(to_jsonb(pe.*) order by pe.created_at desc)
        from (
          select *
          from public.room_playback_events
          where room_id = r.id
            and round_id = (
              select rd.id
              from public.rounds rd
              where rd.room_id = r.id
              order by rd.round_number desc
              limit 1
            )
          order by created_at desc
          limit 10
        ) pe
      ),
      '[]'::jsonb
    )
  )
  from public.rooms r
  where r.id = room_id_value;
$$;

create or replace function public.schedule_matchup_preview(
  room_id_value uuid,
  matchup_id_value uuid,
  submission_id_value uuid,
  lead_ms_value integer default 1500
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  active_round record;
  current_member_id uuid;
  target_matchup record;
  target_submission record;
  normalized_lead_ms integer := least(greatest(coalesce(lead_ms_value, 1500), 500), 10000);
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  limit 1;

  if target_room.id is null then
    raise exception 'Room does not exist.';
  end if;

  if target_room.mode <> 'remote' then
    raise exception 'Room preview sync is only available in Remote Sync mode.';
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
  limit 1;

  if active_round.status <> 'judging' then
    raise exception 'Preview sync is only available while judging.';
  end if;

  if current_member_id <> active_round.judge_member_id then
    raise exception 'Only the judge can start synced previews.';
  end if;

  select *
  into target_matchup
  from public.round_matchups
  where id = matchup_id_value
    and room_id = room_id_value
    and round_id = active_round.id
  limit 1;

  if target_matchup.status <> 'ready' then
    raise exception 'This matchup is not ready for synced preview.';
  end if;

  if submission_id_value <> target_matchup.left_submission_id
    and submission_id_value <> target_matchup.right_submission_id then
    raise exception 'Preview must be one of the active matchup songs.';
  end if;

  select *
  into target_submission
  from public.round_submissions
  where id = submission_id_value
    and room_id = room_id_value
    and round_id = active_round.id
  limit 1;

  if target_submission.preview_url is null or length(trim(target_submission.preview_url)) < 1 then
    raise exception 'This song does not have a playable preview.';
  end if;

  insert into public.room_playback_events (
    room_id,
    round_id,
    matchup_id,
    submission_id,
    created_by_member_id,
    track_id,
    title,
    preview_url,
    duration_ms,
    server_start_at
  )
  values (
    room_id_value,
    active_round.id,
    matchup_id_value,
    submission_id_value,
    current_member_id,
    target_submission.track_id,
    target_submission.title,
    target_submission.preview_url,
    30000,
    clock_timestamp() + (normalized_lead_ms || ' milliseconds')::interval
  );

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.get_server_time()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'server_now_ms',
    floor(extract(epoch from clock_timestamp()) * 1000)::bigint
  );
$$;

grant execute on function public.schedule_matchup_preview(uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.get_server_time() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'room_playback_events'
    ) then
      alter publication supabase_realtime add table public.room_playback_events;
    end if;
  end if;
end;
$$;
