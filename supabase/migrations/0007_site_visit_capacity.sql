-- A customer can only SELECT their own support_requests (by design — one
-- buyer's query subject shouldn't be visible to another). That means the
-- client can't compute "how many other buyers booked this slot" directly.
-- This function exposes only the aggregate count via security definer,
-- without exposing any other buyer's row.
create function public.available_slots_for_project(p_project_id uuid)
returns table (id uuid, slot_date date, slot_time text, capacity int, booked int)
language sql security definer stable as $$
  select
    s.id,
    s.slot_date,
    s.slot_time,
    s.capacity,
    coalesce((
      select count(*)::int from public.support_requests sr
      where sr.site_visit_slot_id = s.id and sr.status not in ('rejected', 'closed')
    ), 0) as booked
  from public.site_visit_slots s
  where s.project_id = p_project_id
  order by s.slot_date, s.slot_time;
$$;

grant execute on function public.available_slots_for_project(uuid) to authenticated;
