-- Core schema: builders/projects/units, customer bookings, construction
-- transparency (drawings/quality/material), government compliance tracking,
-- and RERA profile fields — scoped by role via RLS.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) — carries the role that drives every policy
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'builder_admin')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Builder (tenant), Project, Tower, Unit
-- ---------------------------------------------------------------------------
create table public.builders (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  name text not null,
  city text,
  address text,
  rera_registration_number text,
  rera_registered_name text,
  rera_status text not null default 'not_registered'
    check (rera_status in ('active', 'lapsed', 'expired', 'not_registered')),
  rera_certificate_url text,
  rera_valid_till date,
  created_at timestamptz not null default now()
);

create table public.towers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  total_floors int,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid not null references public.towers(id) on delete cascade,
  unit_number text not null,
  floor int,
  unit_type text,
  carpet_area_sqft numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (tower_id, unit_number)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  booking_code text not null unique,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  booked_at timestamptz not null default now()
);

alter table public.builders enable row level security;
alter table public.projects enable row level security;
alter table public.towers enable row level security;
alter table public.units enable row level security;
alter table public.bookings enable row level security;

-- ---------------------------------------------------------------------------
-- Construction transparency
-- ---------------------------------------------------------------------------
create table public.construction_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tower_id uuid references public.towers(id) on delete set null,
  title text not null,
  description text,
  percent_complete numeric(5, 2),
  status text not null default 'on_schedule'
    check (status in ('on_schedule', 'delayed', 'completed')),
  milestone_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tower_id uuid references public.towers(id) on delete set null,
  title text not null,
  drawing_type text not null default 'floor_plan'
    check (drawing_type in ('floor_plan', 'structural', 'electrical', 'plumbing', 'sanctioned_building_plan', 'other')),
  file_url text not null,
  version int not null default 1,
  uploaded_at timestamptz not null default now()
);

create table public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tower_id uuid references public.towers(id) on delete set null,
  checklist_item text not null,
  result text not null default 'pending' check (result in ('pass', 'fail', 'pending')),
  inspector_name text,
  remarks text,
  checked_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.material_consumption (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tower_id uuid references public.towers(id) on delete set null,
  material_name text not null,
  quantity numeric(12, 2) not null,
  unit text not null,
  log_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.construction_milestones enable row level security;
alter table public.drawings enable row level security;
alter table public.quality_checks enable row level security;
alter table public.material_consumption enable row level security;

-- ---------------------------------------------------------------------------
-- Government compliance tracking
-- ---------------------------------------------------------------------------
create table public.compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  authority text,
  is_default boolean not null default true
);

create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid not null references public.compliance_requirements(id),
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'approved', 'rejected', 'not_applicable')),
  reference_number text,
  document_url text,
  applied_date date,
  approved_date date,
  notes text,
  updated_at timestamptz not null default now(),
  unique (project_id, requirement_id)
);

create table public.premium_calculations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  premium_type text not null,
  calculation_basis text,
  area_sqm numeric(12, 2),
  rate_per_sqm numeric(12, 2),
  calculated_amount numeric(14, 2) not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'waived')),
  paid_date date,
  created_at timestamptz not null default now()
);

alter table public.compliance_requirements enable row level security;
alter table public.compliance_records enable row level security;
alter table public.premium_calculations enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (security definer — internal joins bypass RLS safely,
-- since each function is scoped by auth.uid() or a caller-supplied id and
-- only ever returns a boolean / uuid, never a row).
-- ---------------------------------------------------------------------------
create function public.owns_builder(p_builder_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.builders
    where id = p_builder_id and owner_profile_id = auth.uid()
  );
$$;

create function public.is_builder_owner(p_project_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and public.owns_builder(builder_id)
  );
$$;

create function public.is_project_customer(p_project_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.bookings bk
    join public.units u on u.id = bk.unit_id
    join public.towers t on t.id = u.tower_id
    where t.project_id = p_project_id
      and bk.customer_profile_id = auth.uid()
      and bk.status = 'active'
  );
$$;

create function public.project_of_tower(p_tower_id uuid) returns uuid
  language sql security definer stable as $$
  select project_id from public.towers where id = p_tower_id;
$$;

create function public.project_of_unit(p_unit_id uuid) returns uuid
  language sql security definer stable as $$
  select t.project_id from public.units u
  join public.towers t on t.id = u.tower_id
  where u.id = p_unit_id;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "builder manages own tenant" on public.builders for all to authenticated
  using (owner_profile_id = auth.uid()) with check (owner_profile_id = auth.uid());
create policy "customer views their builder" on public.builders for select to authenticated
  using (exists (select 1 from public.projects pr where pr.builder_id = builders.id and public.is_project_customer(pr.id)));

create policy "builder manages own projects" on public.projects for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));
create policy "customer views booked project" on public.projects for select to authenticated
  using (public.is_project_customer(id));

create policy "builder manages own towers" on public.towers for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views booked project towers" on public.towers for select to authenticated
  using (public.is_project_customer(project_id));

create policy "builder manages own units" on public.units for all to authenticated
  using (public.is_builder_owner(public.project_of_tower(tower_id))) with check (public.is_builder_owner(public.project_of_tower(tower_id)));
create policy "customer views own unit" on public.units for select to authenticated
  using (public.is_project_customer(public.project_of_tower(tower_id)));

create policy "builder manages own bookings" on public.bookings for all to authenticated
  using (public.is_builder_owner(public.project_of_unit(unit_id))) with check (public.is_builder_owner(public.project_of_unit(unit_id)));
create policy "customer views own booking" on public.bookings for select to authenticated
  using (customer_profile_id = auth.uid());
create policy "customer claims unclaimed booking by code" on public.bookings for update to authenticated
  using (customer_profile_id is null)
  with check (customer_profile_id = auth.uid());

create policy "builder manages own milestones" on public.construction_milestones for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project milestones" on public.construction_milestones for select to authenticated
  using (public.is_project_customer(project_id));

create policy "builder manages own drawings" on public.drawings for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project drawings" on public.drawings for select to authenticated
  using (public.is_project_customer(project_id));

create policy "builder manages own quality checks" on public.quality_checks for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project quality checks" on public.quality_checks for select to authenticated
  using (public.is_project_customer(project_id));

create policy "builder manages own material logs" on public.material_consumption for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project material logs" on public.material_consumption for select to authenticated
  using (public.is_project_customer(project_id));

create policy "anyone authenticated reads compliance requirements" on public.compliance_requirements for select to authenticated
  using (true);

create policy "builder manages own compliance records" on public.compliance_records for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project compliance records" on public.compliance_records for select to authenticated
  using (public.is_project_customer(project_id));

create policy "builder manages own premium calculations" on public.premium_calculations for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project premium calculations" on public.premium_calculations for select to authenticated
  using (public.is_project_customer(project_id));

-- ---------------------------------------------------------------------------
-- Auto-provision profile (and builder tenant) on signup from auth metadata
-- ---------------------------------------------------------------------------
create function public.handle_new_user() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );

  if coalesce(new.raw_user_meta_data ->> 'role', 'customer') = 'builder_admin' then
    insert into public.builders (owner_profile_id, name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', 'My Company'));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed the default "necessary compliances" reference list
-- ---------------------------------------------------------------------------
insert into public.compliance_requirements (code, name, description, authority) values
  ('RERA_REGISTRATION', 'RERA Project Registration', 'Registration of the project with the state RERA authority before sale/marketing.', 'State RERA'),
  ('COMMENCEMENT_CERT', 'Commencement Certificate (CC)', 'Permission to begin construction, issued stage-wise by the local planning authority.', 'Municipal Corporation / Planning Authority'),
  ('ENVIRONMENT_CLEARANCE', 'Environmental Clearance', 'Required for projects above the built-up area threshold under EIA notification.', 'State Environment Impact Assessment Authority'),
  ('FIRE_NOC', 'Fire NOC', 'No-objection certificate confirming fire safety systems meet code.', 'Fire Department'),
  ('TREE_AUTHORITY_NOC', 'Tree Authority NOC', 'Clearance for any tree cutting/transplantation on site.', 'Tree Authority / Municipal Corporation'),
  ('STRUCTURAL_STABILITY_CERT', 'Structural Stability Certificate', 'Structural engineer certification of the sanctioned design.', 'Licensed Structural Engineer'),
  ('OCCUPANCY_CERT', 'Occupancy Certificate (OC)', 'Confirms the building is fit for occupation on completion.', 'Municipal Corporation / Planning Authority'),
  ('COMPLETION_CERT', 'Completion Certificate', 'Confirms construction is complete as per the sanctioned plan.', 'Municipal Corporation / Planning Authority');
