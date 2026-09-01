-- Contractor Management: builder-tenant contractor directory, project-scoped
-- work orders, job-progress logs, and payments.

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  name text not null,
  specialization text,
  contact_name text,
  contact_phone text,
  application_status text not null default 'pending'
    check (application_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  wo_number text not null,
  scope_description text,
  estimated_amount numeric(14, 2),
  start_date date,
  end_date date,
  status text not null default 'issued' check (status in ('draft', 'issued', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (project_id, wo_number)
);

create table public.work_order_progress (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  percent_complete numeric(5, 2),
  remarks text,
  update_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.contractor_payments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  amount numeric(14, 2) not null,
  payment_date date not null default current_date,
  mode text not null default 'bank_transfer' check (mode in ('upi', 'bank_transfer', 'cheque', 'cash', 'other')),
  reference_number text,
  created_at timestamptz not null default now()
);

alter table public.contractors enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_progress enable row level security;
alter table public.contractor_payments enable row level security;

create function public.project_of_wo(p_wo_id uuid) returns uuid
  language sql security definer stable as $$
  select project_id from public.work_orders where id = p_wo_id;
$$;

-- Contractor/WO/progress/payment data is internal builder operations — no
-- customer-facing policy on any of these tables.
create policy "builder manages own contractors" on public.contractors for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));

create policy "builder manages own work orders" on public.work_orders for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));

create policy "builder manages own work order progress" on public.work_order_progress for all to authenticated
  using (public.is_builder_owner(public.project_of_wo(work_order_id)))
  with check (public.is_builder_owner(public.project_of_wo(work_order_id)));

create policy "builder manages own contractor payments" on public.contractor_payments for all to authenticated
  using (public.is_builder_owner(public.project_of_wo(work_order_id)))
  with check (public.is_builder_owner(public.project_of_wo(work_order_id)));
