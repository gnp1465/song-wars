create or replace function public.is_room_host_any_status(room_id_value uuid)
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
  );
$$;

create or replace function public.play_again(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
  host_member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_room_host_any_status(room_id_value) then
    raise exception 'Only the host can restart the game.';
  end if;

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  for update;

  if target_room.status <> 'complete' then
    raise exception 'Games can only be restarted after they are complete.';
  end if;

  select id
  into host_member_id
  from public.room_members
  where room_id = room_id_value
    and user_id = target_room.host_user_id
    and role = 'host'
  limit 1;

  if host_member_id is null then
    raise exception 'Host member could not be found.';
  end if;

  delete from public.round_matchups
  where room_id = room_id_value;

  delete from public.round_submissions
  where room_id = room_id_value;

  delete from public.rounds
  where room_id = room_id_value;

  delete from public.room_scores
  where room_id = room_id_value;

  update public.rooms
  set status = 'in_round',
      code = null,
      game_winner_member_id = null
  where id = room_id_value;

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
  );

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
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  if not public.is_room_host_any_status(room_id_value) then
    raise exception 'Only the host can close this room.';
  end if;

  update public.rooms
  set status = 'closed',
      code = null
  where id = room_id_value
    and status <> 'expired';

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.play_again(uuid) to authenticated;
grant execute on function public.close_room(uuid) to authenticated;
