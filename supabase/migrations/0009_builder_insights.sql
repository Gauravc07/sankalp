-- Builder Insights: cross-project customer/payment/support analytics, plus
-- the schema foundation for automated notifications and CRM connectivity
-- (builder_settings, notification_log, api_keys). Fixes a pre-existing RLS
-- gap where a builder could never SELECT a customer's profiles row.

-- ---------------------------------------------------------------------------
-- Let a builder view (name/phone of) customers who hold an active booking
-- in one of their own projects. Previously only "id = auth.uid()" existed,
-- so the UI could only ever show the raw customer_profile_id uuid.
-- ---------------------------------------------------------------------------
create function public.builder_manages_customer(p_customer_id uuid) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.bookings bk
    join public.units u on u.id = bk.unit_id
    join public.towers t on t.id = u.tower_id
    where bk.customer_profile_id = p_customer_id
      and bk.status = 'active'
      and public.is_builder_owner(t.project_id)
  );
$$;

create policy "builder views customer profiles for own bookings" on public.profiles
  for select to authenticated
  using (public.builder_manages_customer(id));

-- ---------------------------------------------------------------------------
-- Cross-project aggregate RPCs for the builder insights dashboard.
-- security definer + an explicit owns_builder check (defense in depth even
-- though RLS on the underlying tables would already scope a normal query).
-- ---------------------------------------------------------------------------
create function public.builder_of_project(p_project_id uuid) returns uuid
  language sql security definer stable as $$
  select builder_id from public.projects where id = p_project_id;
$$;

create function public.builder_payment_health(p_builder_id uuid)
returns table (total_payable numeric, total_collected numeric, total_overdue numeric, overdue_count int)
language sql security definer stable as $$
  select
    coalesce(sum(slab_total), 0) as total_payable,
    coalesce(sum(paid_total), 0) as total_collected,
    coalesce(sum(case when ps.status = 'pending' and ps.due_date < current_date then slab_total - paid_total else 0 end), 0) as total_overdue,
    count(*) filter (where ps.status = 'pending' and ps.due_date < current_date)::int as overdue_count
  from public.payment_slabs ps
  join public.payment_schedules sch on sch.id = ps.payment_schedule_id
  join public.bookings bk on bk.id = sch.booking_id
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  join public.projects pr on pr.id = t.project_id,
  lateral (select ps.base_amount * (1 + ps.gst_percent / 100 - ps.tds_percent / 100) as slab_total) calc,
  lateral (select coalesce((select sum(tx.amount) from public.payment_transactions tx where tx.payment_slab_id = ps.id), 0) as paid_total) paid
  where pr.builder_id = p_builder_id and public.owns_builder(p_builder_id);
$$;

grant execute on function public.builder_payment_health(uuid) to authenticated;

create function public.builder_support_sla(p_builder_id uuid)
returns table (open_count int, in_progress_count int, resolved_count int, avg_resolution_hours numeric, breached_count int)
language sql security definer stable as $$
  select
    count(*) filter (where sr.status = 'open')::int as open_count,
    count(*) filter (where sr.status = 'in_progress')::int as in_progress_count,
    count(*) filter (where sr.status = 'resolved')::int as resolved_count,
    (select avg(extract(epoch from (sr2.resolved_at - sr2.created_at)) / 3600.0)
       from public.support_requests sr2
       join public.bookings bk2 on bk2.id = sr2.booking_id
       join public.units u2 on u2.id = bk2.unit_id
       join public.towers t2 on t2.id = u2.tower_id
       join public.projects pr2 on pr2.id = t2.project_id
       where pr2.builder_id = p_builder_id and sr2.resolved_at is not null) as avg_resolution_hours,
    count(*) filter (where sr.status in ('open', 'in_progress') and sr.created_at < now() - interval '48 hours')::int as breached_count
  from public.support_requests sr
  join public.bookings bk on bk.id = sr.booking_id
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  join public.projects pr on pr.id = t.project_id
  where pr.builder_id = p_builder_id and public.owns_builder(p_builder_id);
$$;

grant execute on function public.builder_support_sla(uuid) to authenticated;

create function public.builder_site_visit_stats(p_builder_id uuid)
returns table (visits_requested int, visits_converted int)
language sql security definer stable as $$
  select
    count(distinct sr.customer_profile_id)::int as visits_requested,
    count(distinct sr.customer_profile_id) filter (where bk.status = 'active')::int as visits_converted
  from public.support_requests sr
  join public.bookings bk on bk.id = sr.booking_id
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  join public.projects pr on pr.id = t.project_id
  where pr.builder_id = p_builder_id and sr.category = 'site_visit' and public.owns_builder(p_builder_id);
$$;

grant execute on function public.builder_site_visit_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Schema foundation for notifications (WhatsApp/email) and CRM connectivity.
-- Writes to notification_log happen only from Edge Functions using the
-- service-role key, mirroring how `notifications` is trigger-populated only.
-- ---------------------------------------------------------------------------
create table public.builder_settings (
  builder_id uuid primary key references public.builders(id) on delete cascade,
  payment_reminder_days_before int not null default 3,
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  webhook_url text,
  webhook_secret text,
  webhook_enabled boolean not null default false,
  webhook_events text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email')),
  template_key text not null,
  recipient text not null,
  related_booking_id uuid references public.bookings(id) on delete set null,
  related_payment_slab_id uuid references public.payment_slabs(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  name text not null default 'CRM integration key',
  key_prefix text not null,
  key_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table public.payment_slabs add column reminder_sent_at timestamptz;

alter table public.builder_settings enable row level security;
alter table public.notification_log enable row level security;
alter table public.api_keys enable row level security;

create policy "builder manages own settings" on public.builder_settings for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));

create policy "builder views own notification log" on public.notification_log for select to authenticated
  using (public.owns_builder(builder_id));

create policy "builder manages own api keys" on public.api_keys for all to authenticated
  using (public.owns_builder(builder_id)) with check (public.owns_builder(builder_id));
