create or replace function public.leave_room(room_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
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

  if target_room.status = 'lobby' then
    delete from public.room_members
    where room_id = room_id_value
      and user_id = auth.uid()
      and role = 'guest';
  end if;

  return public.build_room_snapshot(room_id_value);
end;
$$;

create or replace function public.remove_room_member(room_id_value uuid, member_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room record;
begin
  if not public.is_room_host(room_id_value) then
    raise exception 'Only the host can remove players.';
  end if;

  select *
  into target_room
  from public.rooms
  where id = room_id_value
  limit 1;

  if target_room.status <> 'lobby' then
    raise exception 'Players can only be removed before the game starts.';
  end if;

  delete from public.room_members
  where room_id = room_id_value
    and id = member_id_value
    and role = 'guest';

  return public.build_room_snapshot(room_id_value);
end;
$$;

grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.remove_room_member(uuid, uuid) to authenticated;
