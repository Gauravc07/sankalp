-- Internal team role groups: generalizes the existing staff_members roster
-- (built for site-visit coordination only) to cover five more fixed
-- internal role types, reusing the exact same invite-code-claim mechanism
-- rather than five parallel systems. Access is granted via additional
-- permissive RLS policies alongside the existing builder-only ones (they
-- OR together — nothing existing is narrowed).

-- ---------------------------------------------------------------------------
-- Widen the role check to admit the new internal role types
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in (
    'customer', 'builder_admin', 'site_staff',
    'site_engineer', 'sales_rm', 'support', 'compliance_officer', 'project_manager'
  ));

-- ---------------------------------------------------------------------------
-- staff_members gains a role_type — existing rows (all created via the
-- current "Staff" page for site-visit coordination) default correctly to
-- 'site_staff'. staff_daily_availability and the site-visit auto-assignment
-- trigger stay untouched — they remain meaningful only for role_type =
-- 'site_staff' rows.
-- ---------------------------------------------------------------------------
alter table public.staff_members add column role_type text not null default 'site_staff'
  check (role_type in ('site_staff', 'site_engineer', 'sales_rm', 'support', 'compliance_officer', 'project_manager'));

-- ---------------------------------------------------------------------------
-- Helper: is the current user an active team member of this builder, in one
-- of the given role types? security definer (same rationale as
-- is_assigned_staff in 0010 — avoids RLS recursion between staff_members
-- and the tables that reference it).
-- ---------------------------------------------------------------------------
create function public.is_builder_team_member(p_builder_id uuid, p_role_types text[]) returns boolean
  language sql security definer stable as $$
  select exists (
    select 1 from public.staff_members sm
    where sm.profile_id = auth.uid() and sm.is_active
      and sm.role_type = any(p_role_types) and sm.builder_id = p_builder_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Read access for any active team member (any role) — needed for the
-- project picker and reused tabs to render at all.
-- ---------------------------------------------------------------------------
create policy "team member views own builder" on public.builders for select to authenticated
  using (public.is_builder_team_member(id, array['site_staff','site_engineer','sales_rm','support','compliance_officer','project_manager']));

create policy "team member views own builder projects" on public.projects for select to authenticated
  using (public.is_builder_team_member(builder_id, array['site_staff','site_engineer','sales_rm','support','compliance_officer','project_manager']));

create policy "team member views own builder towers" on public.towers for select to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['site_staff','site_engineer','sales_rm','support','compliance_officer','project_manager']));

create policy "team member views own builder units" on public.units for select to authenticated
  using (public.is_builder_team_member(public.builder_of_project(public.project_of_tower(tower_id)), array['site_staff','site_engineer','sales_rm','support','compliance_officer','project_manager']));

-- ---------------------------------------------------------------------------
-- Site Engineer + Project Manager: construction transparency tables
-- ---------------------------------------------------------------------------
create policy "site engineer manages construction milestones" on public.construction_milestones for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']));

create policy "site engineer manages drawings" on public.drawings for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']));

create policy "site engineer manages quality checks" on public.quality_checks for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']));

create policy "site engineer manages material consumption" on public.material_consumption for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['site_engineer','project_manager']));

-- ---------------------------------------------------------------------------
-- Sales/RM + Project Manager: bookings
-- ---------------------------------------------------------------------------
create policy "sales rm manages bookings" on public.bookings for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(public.project_of_unit(unit_id)), array['sales_rm','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(public.project_of_unit(unit_id)), array['sales_rm','project_manager']));

-- ---------------------------------------------------------------------------
-- Support + Sales/RM + Project Manager: customer requests
-- ---------------------------------------------------------------------------
create policy "support team manages requests" on public.support_requests for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(public.project_of_booking(booking_id)), array['support','sales_rm','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(public.project_of_booking(booking_id)), array['support','sales_rm','project_manager']));

create policy "support team views request messages" on public.support_request_messages for select to authenticated
  using (public.is_builder_team_member(public.builder_of_project(public.project_of_support_request(support_request_id)), array['support','sales_rm','project_manager']));

create policy "support team adds request messages" on public.support_request_messages for insert to authenticated
  with check (
    sender_role = 'builder'
    and public.is_builder_team_member(public.builder_of_project(public.project_of_support_request(support_request_id)), array['support','sales_rm','project_manager'])
  );

-- ---------------------------------------------------------------------------
-- Compliance Officer + Project Manager: compliance records
-- ---------------------------------------------------------------------------
create policy "compliance officer manages records" on public.compliance_records for all to authenticated
  using (public.is_builder_team_member(public.builder_of_project(project_id), array['compliance_officer','project_manager']))
  with check (public.is_builder_team_member(public.builder_of_project(project_id), array['compliance_officer','project_manager']));
