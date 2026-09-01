-- After-sales workflow: Flat Overview extensions, Documents & Receipts Vault
-- expansion, Support Hub (FAQ + Contacts), the unified Request Engine
-- (general query / NOC / add-on / site visit), and a phase-2-gated
-- Occupancy Declaration.

-- ---------------------------------------------------------------------------
-- Flat Overview: itemized unit charges, a location map link, a listed price
-- ---------------------------------------------------------------------------
alter table public.projects add column map_embed_url text;
alter table public.units add column list_price numeric(14, 2);
alter table public.units add column parking_details text;

create table public.unit_charges (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  charge_name text not null,
  amount numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.unit_charges enable row level security;

create policy "builder manages own unit charges" on public.unit_charges for all to authenticated
  using (public.is_builder_owner(public.project_of_unit(unit_id)))
  with check (public.is_builder_owner(public.project_of_unit(unit_id)));
create policy "customer views own unit charges" on public.unit_charges for select to authenticated
  using (exists (
    select 1 from public.bookings bk where bk.unit_id = unit_charges.unit_id and bk.customer_profile_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- Documents & Receipts Vault: widen categories, auto-generate a receipt
-- document whenever a payment transaction is recorded
-- ---------------------------------------------------------------------------
alter table public.documents drop constraint documents_category_check;
alter table public.documents add constraint documents_category_check
  check (category in ('allotment_letter', 'agreement', 'legal', 'receipt', 'noc', 'other'));

create function public.create_receipt_document() returns trigger
  language plpgsql security definer as $$
declare
  v_booking_id uuid;
  v_label text;
  v_project_id uuid;
begin
  select psl.label, psc.booking_id into v_label, v_booking_id
  from public.payment_slabs psl
  join public.payment_schedules psc on psc.id = psl.payment_schedule_id
  where psl.id = new.payment_slab_id;

  v_project_id := public.project_of_booking(v_booking_id);

  insert into public.documents (project_id, booking_id, category, title, status)
  values (
    v_project_id,
    v_booking_id,
    'receipt',
    'Receipt — ' || v_label || ' — ' || to_char(new.payment_date, 'DD Mon YYYY'),
    'generated'
  );
  return new;
end;
$$;

create trigger trg_create_receipt
  after insert on public.payment_transactions
  for each row execute function public.create_receipt_document();

-- ---------------------------------------------------------------------------
-- Support Hub: FAQ (per builder tenant) + Contacts (per project)
-- ---------------------------------------------------------------------------
create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  category text not null default 'general',
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role_label text not null,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;
alter table public.contacts enable row level security;

create policy "builder manages own faq items" on public.faq_items for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));
create policy "customer views published faqs for their builder" on public.faq_items for select to authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.bookings bk
      join public.units u on u.id = bk.unit_id
      join public.towers t on t.id = u.tower_id
      join public.projects p on p.id = t.project_id
      where bk.customer_profile_id = auth.uid() and bk.status = 'active' and p.builder_id = faq_items.builder_id
    )
  );

create policy "builder manages own contacts" on public.contacts for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project contacts" on public.contacts for select to authenticated
  using (public.is_project_customer(project_id));

-- ---------------------------------------------------------------------------
-- Request Engine: one buyer-facing entry point, category-specific columns,
-- a builder-defined site-visit slot calendar, and a lightweight message
-- thread per request.
-- ---------------------------------------------------------------------------
create table public.site_visit_slots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slot_date date not null,
  slot_time text not null,
  capacity int not null default 1,
  created_at timestamptz not null default now()
);

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('general_query', 'noc_request', 'addon_request', 'site_visit')),
  subject text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed', 'rejected')),

  -- NOC-specific
  noc_type text,
  issued_document_id uuid references public.documents(id) on delete set null,

  -- Add-on/change-request specific
  quoted_amount numeric(14, 2),
  quote_status text check (quote_status in ('pending', 'quoted', 'accepted', 'declined')),
  work_order_id uuid references public.work_orders(id) on delete set null,

  -- Site-visit specific
  site_visit_slot_id uuid references public.site_visit_slots(id) on delete set null,
  visit_purpose text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.support_request_messages (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'builder')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.site_visit_slots enable row level security;
alter table public.support_requests enable row level security;
alter table public.support_request_messages enable row level security;

create function public.project_of_support_request(p_id uuid) returns uuid
  language sql security definer stable as $$
  select public.project_of_booking(booking_id) from public.support_requests where id = p_id;
$$;

create policy "builder manages own site visit slots" on public.site_visit_slots for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own project site visit slots" on public.site_visit_slots for select to authenticated
  using (public.is_project_customer(project_id));

create policy "customer manages own requests" on public.support_requests for all to authenticated
  using (customer_profile_id = auth.uid())
  with check (customer_profile_id = auth.uid() and public.is_booking_owner(booking_id));
create policy "builder manages requests for own projects" on public.support_requests for all to authenticated
  using (public.is_builder_owner(public.project_of_booking(booking_id)))
  with check (public.is_builder_owner(public.project_of_booking(booking_id)));

create policy "customer views messages on own requests" on public.support_request_messages for select to authenticated
  using (exists (select 1 from public.support_requests sr where sr.id = support_request_id and sr.customer_profile_id = auth.uid()));
create policy "customer adds messages on own requests" on public.support_request_messages for insert to authenticated
  with check (
    sender_role = 'customer'
    and exists (select 1 from public.support_requests sr where sr.id = support_request_id and sr.customer_profile_id = auth.uid())
  );
create policy "builder views messages on own project requests" on public.support_request_messages for select to authenticated
  using (public.is_builder_owner(public.project_of_support_request(support_request_id)));
create policy "builder adds messages on own project requests" on public.support_request_messages for insert to authenticated
  with check (sender_role = 'builder' and public.is_builder_owner(public.project_of_support_request(support_request_id)));

-- ---------------------------------------------------------------------------
-- Occupancy Declaration — Phase 2. The UI gates this behind the project's
-- Occupancy Certificate compliance status; RLS just enforces booking
-- ownership, since the OC gate is a product decision, not a security one.
-- ---------------------------------------------------------------------------
create table public.unit_occupancy_status (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  occupancy_status text not null check (occupancy_status in ('self_occupied', 'rented', 'vacant')),
  notes text,
  declared_at timestamptz not null default now()
);

alter table public.unit_occupancy_status enable row level security;

create policy "customer manages own occupancy status" on public.unit_occupancy_status for all to authenticated
  using (public.is_booking_owner(booking_id)) with check (public.is_booking_owner(booking_id));
create policy "builder views occupancy status for own projects" on public.unit_occupancy_status for select to authenticated
  using (public.is_builder_owner(public.project_of_booking(booking_id)));
