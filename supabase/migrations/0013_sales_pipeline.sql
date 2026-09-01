-- Sales pipeline: Leads (pre-booking) -> Deals (negotiation on a specific
-- unit) -> Bookings (existing table, now optionally deal-sourced) ->
-- Closures (post-booking paperwork/registration/handover checklist,
-- auto-created per booking). All project-scoped, reusing the existing
-- builder-owner + sales-team RLS shape from 0002/0012.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  req_number bigint generated always as identity,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  property_type text,
  min_budget numeric(14, 2),
  max_budget numeric(14, 2),
  status text not null default 'new' check (status in ('new', 'qualified', 'non_prospect', 'lost', 'closed')),
  assigned_to uuid references public.staff_members(id) on delete set null,
  next_follow_up_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'won', 'lost')),
  offered_price numeric(14, 2),
  next_follow_up_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings add column deal_id uuid references public.deals(id) on delete set null;

create table public.closures (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  agreement_status text not null default 'pending' check (agreement_status in ('pending', 'drafted', 'sent_for_signature', 'signed')),
  registration_status text not null default 'pending' check (registration_status in ('pending', 'scheduled', 'completed')),
  registration_date date,
  handover_status text not null default 'pending' check (handover_status in ('pending', 'ready', 'handed_over')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.closures enable row level security;

-- ---------------------------------------------------------------------------
-- Auto-create a closure checklist row whenever a booking is made (same
-- shape as mark_unit_booked() in 0003_sales_management.sql).
-- ---------------------------------------------------------------------------
create function public.create_closure_on_booking() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.closures (booking_id, project_id)
  values (new.id, public.project_of_unit(new.unit_id));
  return new;
end;
$$;

create trigger trg_create_closure_on_booking
  after insert on public.bookings
  for each row execute function public.create_closure_on_booking();

-- ---------------------------------------------------------------------------
-- RLS: leads
-- ---------------------------------------------------------------------------
create policy "builder manages own leads" on public.leads for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "sales team manages leads" on public.leads for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']));

-- ---------------------------------------------------------------------------
-- RLS: deals
-- ---------------------------------------------------------------------------
create policy "builder manages own deals" on public.deals for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "sales team manages deals" on public.deals for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']));

-- ---------------------------------------------------------------------------
-- RLS: closures
-- ---------------------------------------------------------------------------
create policy "builder manages own closures" on public.closures for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "sales team manages closures" on public.closures for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['sales_rm','project_manager']));
create policy "customer views own closure" on public.closures for select to authenticated
  using (public.is_booking_owner(booking_id));
