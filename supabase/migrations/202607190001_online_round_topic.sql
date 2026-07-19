alter table public.rounds
  add column if not exists topic text;

do $$
declare
  existing_constraint_name text;
begin
  select conname
  into existing_constraint_name
  from pg_constraint
  where conrelid = 'public.rounds'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if existing_constraint_name is not null then
    execute format('alter table public.rounds drop constraint %I', existing_constraint_name);
  end if;
end;
$$;

alter table public.rounds
  add constraint rounds_status_check
  check (status in ('waiting_for_topic', 'submitting', 'judging', 'complete'));

create or replace function public.submit_round_topic(room_id_value uuid, topic_value text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_round record;
  normalized_topic text := trim(topic_value);
begin
  perform public.expire_stale_rooms();

  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if length(normalized_topic) < 1 then
    raise exception 'Topic is required.';
  end if;

  if length(normalized_topic) > 80 then
    raise exception 'Topic must be 80 characters or fewer.';
  end if;

  select rd.*
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

  if active_round.status <> 'waiting_for_topic' then
    raise exception 'Topic is already locked for this round.';
  end if;

  if not exists (
    select 1
    from public.room_members m
    where m.id = active_round.judge_member_id
      and m.user_id = auth.uid()
  ) then
    raise exception 'Only the judge can submit the topic.';
  end if;

  update public.rounds
  set topic = normalized_topic,
      status = 'submitting'
  where id = active_round.id;

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.submit_round_topic(uuid, text) to authenticated;
