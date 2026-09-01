-- Waitlist signups captured from the landing page CTA.
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in (
    'builder_developer', 'buyer', 'channel_partner', 'other'
  )),
  company text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- Landing page uses the anon key only to insert new signups, never to read them back.
create policy "Anyone can join the waitlist"
  on public.waitlist_signups
  for insert
  to anon
  with check (true);
