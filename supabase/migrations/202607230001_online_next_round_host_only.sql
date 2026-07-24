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

  if current_member.user_id <> target_room.host_user_id then
    raise exception 'Only the host can start the next round.';
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

grant execute on function public.prepare_next_round(uuid) to authenticated;
