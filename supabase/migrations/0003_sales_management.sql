-- Sales Management: inventory status, payment schedule/slabs/transactions,
-- documents (allotment/agreement), and an in-app notification inbox.

alter table public.units
  add column status text not null default 'available'
    check (status in ('available', 'blocked', 'booked', 'sold'));

create table public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  sale_price numeric(14, 2),
  created_at timestamptz not null default now()
);

create table public.payment_slabs (
  id uuid primary key default gen_random_uuid(),
  payment_schedule_id uuid not null references public.payment_schedules(id) on delete cascade,
  label text not null,
  base_amount numeric(14, 2) not null,
  gst_percent numeric(5, 2) not null default 5,
  tds_percent numeric(5, 2) not null default 0,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_slab_id uuid not null references public.payment_slabs(id) on delete cascade,
  amount numeric(14, 2) not null,
  payment_date date not null default current_date,
  mode text not null default 'bank_transfer' check (mode in ('upi', 'bank_transfer', 'cheque', 'cash', 'card', 'other')),
  reference_number text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  category text not null default 'other'
    check (category in ('allotment_letter', 'agreement', 'legal', 'other')),
  title text not null,
  file_url text,
  status text not null default 'draft' check (status in ('draft', 'generated', 'sent_for_signature', 'signed')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_schedules enable row level security;
alter table public.payment_slabs enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (same security-definer pattern as 0002)
-- ---------------------------------------------------------------------------
create function public.is_booking_owner(p_booking_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.bookings
    where id = p_booking_id and customer_profile_id = auth.uid()
  );
$$;

create function public.project_of_booking(p_booking_id uuid) returns uuid
  language sql security definer stable as $$
  select t.project_id from public.bookings bk
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  where bk.id = p_booking_id;
$$;

create function public.booking_of_schedule(p_schedule_id uuid) returns uuid
  language sql security definer stable as $$
  select booking_id from public.payment_schedules where id = p_schedule_id;
$$;

create function public.project_of_schedule(p_schedule_id uuid) returns uuid
  language sql security definer stable as $$
  select public.project_of_booking(public.booking_of_schedule(p_schedule_id));
$$;

create function public.schedule_of_slab(p_slab_id uuid) returns uuid
  language sql security definer stable as $$
  select payment_schedule_id from public.payment_slabs where id = p_slab_id;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "builder manages own payment schedules" on public.payment_schedules for all to authenticated
  using (public.is_builder_owner(public.project_of_booking(booking_id)))
  with check (public.is_builder_owner(public.project_of_booking(booking_id)));
create policy "customer views own payment schedule" on public.payment_schedules for select to authenticated
  using (public.is_booking_owner(booking_id));

create policy "builder manages own payment slabs" on public.payment_slabs for all to authenticated
  using (public.is_builder_owner(public.project_of_schedule(payment_schedule_id)))
  with check (public.is_builder_owner(public.project_of_schedule(payment_schedule_id)));
create policy "customer views own payment slabs" on public.payment_slabs for select to authenticated
  using (public.is_booking_owner(public.booking_of_schedule(payment_schedule_id)));

create policy "builder manages own payment transactions" on public.payment_transactions for all to authenticated
  using (public.is_builder_owner(public.project_of_schedule(public.schedule_of_slab(payment_slab_id))))
  with check (public.is_builder_owner(public.project_of_schedule(public.schedule_of_slab(payment_slab_id))));
create policy "customer views own payment transactions" on public.payment_transactions for select to authenticated
  using (public.is_booking_owner(public.booking_of_schedule(public.schedule_of_slab(payment_slab_id))));

create policy "builder manages own documents" on public.documents for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));
create policy "customer views own documents" on public.documents for select to authenticated
  using (
    (booking_id is not null and public.is_booking_owner(booking_id))
    or (booking_id is null and public.is_project_customer(project_id))
  );

create policy "customer views own notifications" on public.notifications for select to authenticated
  using (customer_profile_id = auth.uid());
create policy "customer marks own notifications read" on public.notifications for update to authenticated
  using (customer_profile_id = auth.uid()) with check (customer_profile_id = auth.uid());
create policy "builder sends notifications for own projects" on public.notifications for insert to authenticated
  with check (project_id is null or public.is_builder_owner(project_id));
create policy "builder views notifications for own projects" on public.notifications for select to authenticated
  using (project_id is not null and public.is_builder_owner(project_id));

-- ---------------------------------------------------------------------------
-- Automatic notifications + inventory sync
-- ---------------------------------------------------------------------------
create function public.mark_unit_booked() returns trigger
  language plpgsql security definer as $$
begin
  update public.units set status = 'booked' where id = new.unit_id and status = 'available';
  return new;
end;
$$;

create trigger trg_mark_unit_booked
  after insert on public.bookings
  for each row execute function public.mark_unit_booked();

create function public.notify_customers_on_milestone() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.notifications (customer_profile_id, project_id, title, body, link)
  select bk.customer_profile_id, new.project_id,
         'New construction update: ' || new.title,
         coalesce(new.description, new.title) || ' — ' || coalesce(new.percent_complete::text, '') || '% complete',
         '/customer/construction'
  from public.bookings bk
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  where t.project_id = new.project_id and bk.customer_profile_id is not null and bk.status = 'active';
  return new;
end;
$$;

create trigger trg_notify_milestone
  after insert on public.construction_milestones
  for each row execute function public.notify_customers_on_milestone();

create function public.notify_customer_on_slab() returns trigger
  language plpgsql security definer as $$
declare
  v_customer uuid;
begin
  select bk.customer_profile_id into v_customer
  from public.payment_schedules ps
  join public.bookings bk on bk.id = ps.booking_id
  where ps.id = new.payment_schedule_id;

  if v_customer is not null then
    insert into public.notifications (customer_profile_id, project_id, title, body, link)
    values (
      v_customer,
      public.project_of_schedule(new.payment_schedule_id),
      'New payment due: ' || new.label,
      'Amount: Rs ' || new.base_amount || coalesce(' · Due ' || new.due_date::text, ''),
      '/customer/payments'
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_slab
  after insert on public.payment_slabs
  for each row execute function public.notify_customer_on_slab();

create function public.notify_customer_on_document() returns trigger
  language plpgsql security definer as $$
declare
  v_customer uuid;
begin
  if new.booking_id is null or new.status not in ('generated', 'signed') then
    return new;
  end if;

  select customer_profile_id into v_customer from public.bookings where id = new.booking_id;
  if v_customer is not null then
    insert into public.notifications (customer_profile_id, project_id, title, body, link)
    values (v_customer, new.project_id, 'Document ready: ' || new.title, 'Status: ' || new.status, '/customer/payments');
  end if;
  return new;
end;
$$;

create trigger trg_notify_document
  after insert or update on public.documents
  for each row execute function public.notify_customer_on_document();
