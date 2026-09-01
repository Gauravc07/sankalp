-- Builder-provisioned customer accounts: the builder can enter a buyer's
-- name/email/phone at the point of sale, and share a personal activation
-- link instead of a bare booking code. The actual auth.users account is
-- still created by the buyer's own browser session (this app has no
-- service-role backend to create it on the builder's behalf) — this just
-- lets the signup form pre-fill and lock the buyer's details from a code
-- in the URL, via a read accessible while logged out.

alter table public.bookings
  add column pending_customer_name text,
  add column pending_customer_email text,
  add column pending_customer_phone text;

create function public.booking_activation_info(p_code text)
returns table (
  full_name text,
  email text,
  phone text,
  unit_number text,
  tower_name text,
  project_name text,
  already_claimed boolean
)
language sql security definer stable as $$
  select
    bk.pending_customer_name, bk.pending_customer_email, bk.pending_customer_phone,
    u.unit_number, t.name, p.name,
    bk.customer_profile_id is not null
  from public.bookings bk
  join public.units u on u.id = bk.unit_id
  join public.towers t on t.id = u.tower_id
  join public.projects p on p.id = t.project_id
  where bk.booking_code = p_code;
$$;

grant execute on function public.booking_activation_info(text) to anon, authenticated;
