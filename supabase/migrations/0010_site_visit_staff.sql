-- Site visit staff: builder-tenant staff roster with a new `site_staff`
-- role, per-staff-per-date availability, greedy least-loaded auto-assignment
-- on site-visit booking, and two-step visit completion (staff marks done,
-- customer confirms — or customer self-attests directly).

-- ---------------------------------------------------------------------------
-- Widen the role check to admit 'site_staff'
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'builder_admin', 'site_staff'));

-- ---------------------------------------------------------------------------
-- Staff roster (builder-tenant-wide, not project-scoped) + daily availability
-- ---------------------------------------------------------------------------
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  invite_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_daily_availability (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null references public.staff_members(id) on delete cascade,
  available_date date not null,
  created_at timestamptz not null default now(),
  unique (staff_member_id, available_date)
);

alter table public.staff_members enable row level security;
alter table public.staff_daily_availability enable row level security;

-- ---------------------------------------------------------------------------
-- support_requests: assignment + two-step completion columns
-- ---------------------------------------------------------------------------
alter table public.support_requests
  add column assigned_staff_id uuid references public.staff_members(id) on delete set null,
  add column visit_completed_by text check (visit_completed_by in ('customer', 'staff')),
  add column visit_completed_at timestamptz,
  add column visit_confirmed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Auto-assignment: greedy least-loaded staff member for the visit's date.
-- Scale-appropriate choice (no distributed locking / serializable tx) — a
-- small theoretical race window under truly concurrent inserts is accepted
-- at this app's booking volume, same tradeoff already made elsewhere.
-- ---------------------------------------------------------------------------
create function public.assign_site_visit_staff() returns trigger
  language plpgsql security definer as $$
declare
  v_project_id uuid;
  v_builder_id uuid;
  v_slot_date date;
  v_staff_id uuid;
begin
  if new.category <> 'site_visit' or new.site_visit_slot_id is null then
    return new;
  end if;

  v_project_id := public.project_of_booking(new.booking_id);
  v_builder_id := public.builder_of_project(v_project_id);
  select slot_date into v_slot_date from public.site_visit_slots where id = new.site_visit_slot_id;

  if v_slot_date is null or v_builder_id is null then
    return new;
  end if;

  select sm.id into v_staff_id
  from public.staff_members sm
  join public.staff_daily_availability da
    on da.staff_member_id = sm.id and da.available_date = v_slot_date
  where sm.builder_id = v_builder_id and sm.is_active = true
  order by (
    select count(*) from public.support_requests sr2
    join public.site_visit_slots svs2 on svs2.id = sr2.site_visit_slot_id
    where sr2.assigned_staff_id = sm.id
      and svs2.slot_date = v_slot_date
      and sr2.status not in ('rejected', 'closed')
  ) asc, random()
  limit 1;

  new.assigned_staff_id := v_staff_id; -- stays null if nobody is available that date
  return new;
end;
$$;

create trigger trg_assign_site_visit_staff
  before insert on public.support_requests
  for each row execute function public.assign_site_visit_staff();

-- ---------------------------------------------------------------------------
-- Staff's flattened read of their own assigned visits (avoids opening
-- bookings/units/towers RLS to a new role — same rationale as 0009's
-- builder_payment_health/builder_support_sla RPCs).
-- ---------------------------------------------------------------------------
create function public.staff_my_assigned_visits(p_date date default current_date)
returns table (
  request_id uuid,
  status text,
  slot_date date,
  slot_time text,
  visit_purpose text,
  subject text,
  unit_number text,
  tower_name text,
  customer_name text,
  customer_phone text,
  visit_completed_by text,
  visit_completed_at timestamptz,
  visit_confirmed_at timestamptz
)
language sql security definer stable as $$
  select
    sr.id, sr.status, svs.slot_date, svs.slot_time, sr.visit_purpose, sr.subject,
    u.unit_number, t.name, p.full_name, p.phone,
    sr.visit_completed_by, sr.visit_completed_at, sr.visit_confirmed_at
  from public.support_requests sr
  join public.staff_members sm on sm.id = sr.assigned_staff_id
  join public.site_visit_slots svs on svs.id = sr.site_visit_slot_id
  join public.bookings bk on bk.id = sr.booking_id
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  join public.profiles p on p.id = sr.customer_profile_id
  where sm.profile_id = auth.uid() and svs.slot_date = p_date
  order by svs.slot_time;
$$;

grant execute on function public.staff_my_assigned_visits(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Helper: is the current user the staff member assigned to this row?
-- MUST be security definer (not an inline exists() in the policy below) —
-- staff_members has its own policy that reads back from support_requests
-- ("customer views assigned staff for own visits"), so an inline
-- cross-reference from support_requests -> staff_members would create RLS
-- infinite recursion between the two tables. A security definer function
-- resolves the staff_members lookup with the function owner's privileges,
-- bypassing staff_members' RLS for this internal check and breaking the
-- cycle — same rationale as owns_builder/is_builder_owner in 0002.
-- ---------------------------------------------------------------------------
create function public.is_assigned_staff(p_staff_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.staff_members sm
    where sm.id = p_staff_id and sm.profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: staff_members
-- ---------------------------------------------------------------------------
create policy "builder manages own staff" on public.staff_members for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));

-- Mirrors "customer claims unclaimed booking by code" (0002) exactly: the
-- invite_code match is enforced client-side by the .eq('invite_code', code)
-- filter in claimStaffInvite(), same trust boundary as claimBooking().
create policy "staff claims unclaimed invite by code" on public.staff_members for update to authenticated
  using (profile_id is null)
  with check (profile_id = auth.uid());

-- Narrow read so a customer's request detail can show the assigned staff's
-- name/phone, scoped only to visits actually assigned to them.
create policy "customer views assigned staff for own visits" on public.staff_members for select to authenticated
  using (exists (
    select 1 from public.support_requests sr
    where sr.assigned_staff_id = staff_members.id and sr.customer_profile_id = auth.uid()
  ));

-- A staff member must be able to SELECT their own (already-claimed) row —
-- without this, is_assigned_staff() (which runs as the function owner, not
-- subject to RLS) still works, but any future direct staff_members read of
-- one's own row from the client would otherwise come back empty.
create policy "staff views own staff record" on public.staff_members for select to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: staff_daily_availability (builder-managed only; staff never toggle
-- their own availability in this iteration)
-- ---------------------------------------------------------------------------
create policy "builder manages own staff availability" on public.staff_daily_availability for all to authenticated
  using (exists (
    select 1 from public.staff_members sm
    where sm.id = staff_daily_availability.staff_member_id and public.owns_builder(sm.builder_id)
  ))
  with check (exists (
    select 1 from public.staff_members sm
    where sm.id = staff_daily_availability.staff_member_id and public.owns_builder(sm.builder_id)
  ));

-- ---------------------------------------------------------------------------
-- RLS: support_requests — let assigned staff view and mark their own visit
-- complete. An UPDATE policy alone is not enough: UPDATE's WHERE-clause row
-- lookup requires SELECT-level visibility too, so a companion SELECT policy
-- is required or the row is never found as an update candidate in the first
-- place. Row-level only (same as the existing customer "for all" policy,
-- which is likewise not column-restricted) — the UI constrains which
-- columns are actually written.
-- ---------------------------------------------------------------------------
create policy "staff views own assigned visits" on public.support_requests for select to authenticated
  using (public.is_assigned_staff(assigned_staff_id));

create policy "staff updates own assigned visits" on public.support_requests for update to authenticated
  using (public.is_assigned_staff(assigned_staff_id))
  with check (public.is_assigned_staff(assigned_staff_id));
