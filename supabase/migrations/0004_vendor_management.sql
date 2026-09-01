-- Vendor Management: builder-tenant vendor directory, project-scoped POs,
-- challans and invoices, and payments (reconciliation is computed client-side
-- from invoices vs payments vs PO amount rather than a live bank feed).

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  name text not null,
  trade text,
  contact_name text,
  contact_phone text,
  gstin text,
  application_status text not null default 'pending'
    check (application_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  po_number text not null,
  description text,
  amount numeric(14, 2) not null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'fulfilled', 'cancelled')),
  issued_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (project_id, po_number)
);

create table public.delivery_challans (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  challan_number text not null,
  quantity_received text,
  received_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  invoice_number text not null,
  invoice_url text,
  amount numeric(14, 2) not null,
  uploaded_at timestamptz not null default now()
);

create table public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  amount numeric(14, 2) not null,
  payment_date date not null default current_date,
  mode text not null default 'bank_transfer' check (mode in ('upi', 'bank_transfer', 'cheque', 'cash', 'other')),
  reference_number text,
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.delivery_challans enable row level security;
alter table public.vendor_invoices enable row level security;
alter table public.vendor_payments enable row level security;

create function public.project_of_po(p_po_id uuid) returns uuid
  language sql security definer stable as $$
  select project_id from public.purchase_orders where id = p_po_id;
$$;

-- Vendor/PO/challan/invoice/payment data is internal to the builder's
-- operations — no customer-facing policy on any of these tables.
create policy "builder manages own vendors" on public.vendors for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));

create policy "builder manages own purchase orders" on public.purchase_orders for all to authenticated
  using (public.is_builder_owner(project_id)) with check (public.is_builder_owner(project_id));

create policy "builder manages own delivery challans" on public.delivery_challans for all to authenticated
  using (public.is_builder_owner(public.project_of_po(purchase_order_id)))
  with check (public.is_builder_owner(public.project_of_po(purchase_order_id)));

create policy "builder manages own vendor invoices" on public.vendor_invoices for all to authenticated
  using (public.is_builder_owner(public.project_of_po(purchase_order_id)))
  with check (public.is_builder_owner(public.project_of_po(purchase_order_id)));

create policy "builder manages own vendor payments" on public.vendor_payments for all to authenticated
  using (public.is_builder_owner(public.project_of_po(purchase_order_id)))
  with check (public.is_builder_owner(public.project_of_po(purchase_order_id)));
