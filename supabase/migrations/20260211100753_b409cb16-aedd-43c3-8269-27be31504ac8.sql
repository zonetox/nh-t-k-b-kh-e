
-- ============================================
-- PROMPT 8: ADMIN + MEDICAL CONFIG ENGINE
-- ============================================

-- 1. Role system (separate table per security best practices)
create type public.app_role as enum ('super_admin', 'medical_admin', 'finance_admin', 'support_admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 2. Security definer functions for role checks
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_any_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
  )
$$;

-- 3. RLS for user_roles
create policy "Any admin can view roles" on public.user_roles
  for select to authenticated
  using (public.is_any_admin(auth.uid()));

create policy "Super admin can insert roles" on public.user_roles
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'super_admin'));

create policy "Super admin can delete roles" on public.user_roles
  for delete to authenticated
  using (public.has_role(auth.uid(), 'super_admin'));

-- 4. Enhance vaccines table for medical config
alter table public.vaccines add column if not exists is_mandatory boolean default false;
alter table public.vaccines add column if not exists code text;

-- 5. Add versioning to vaccine_dose_rules
alter table public.vaccine_dose_rules add column if not exists version integer default 1;
alter table public.vaccine_dose_rules add column if not exists applied_from date default current_date;

-- 6. National schedule version tracking
create table public.schedule_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null,
  description text,
  published_by uuid references auth.users(id),
  published_at timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.schedule_versions enable row level security;

create policy "Anyone can view active versions" on public.schedule_versions
  for select to authenticated using (true);

create policy "Medical admin can manage versions" on public.schedule_versions
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'medical_admin'));

create policy "Medical admin can update versions" on public.schedule_versions
  for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'medical_admin'));

-- 7. Update existing RLS policies to include admin access

-- profiles: admin can view all + support/super can update
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users or admins can view profiles" on public.profiles
  for select to authenticated
  using (auth.uid() = id OR public.is_any_admin(auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users or admins can update profiles" on public.profiles
  for update to authenticated
  using (auth.uid() = id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'support_admin'));

-- babies: admin can view all
drop policy if exists "Users can view own babies" on public.babies;
create policy "Users or admins can view babies" on public.babies
  for select to authenticated
  using ((auth.uid() = user_id AND deleted_at IS NULL) OR public.is_any_admin(auth.uid()));

-- vaccine_schedules: admin can view all
drop policy if exists "Users can view own schedules" on public.vaccine_schedules;
create policy "Users or admins can view schedules" on public.vaccine_schedules
  for select to authenticated
  using (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = vaccine_schedules.baby_id AND babies.user_id = auth.uid())
    OR public.is_any_admin(auth.uid())
  );

-- vaccines: admin can manage + view inactive
drop policy if exists "Anyone can view vaccines" on public.vaccines;
create policy "View vaccines" on public.vaccines
  for select to authenticated
  using (is_active = true OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

create policy "Medical admin can insert vaccines" on public.vaccines
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

create policy "Medical admin can update vaccines" on public.vaccines
  for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

-- vaccine_dose_rules: admin can manage
drop policy if exists "Anyone can view dose rules" on public.vaccine_dose_rules;
create policy "View dose rules" on public.vaccine_dose_rules
  for select to authenticated
  using (is_active = true OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

create policy "Medical admin can insert dose rules" on public.vaccine_dose_rules
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

create policy "Medical admin can update dose rules" on public.vaccine_dose_rules
  for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'medical_admin'));

-- payments: finance/super admin access
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users or admins can view payments" on public.payments
  for select to authenticated
  using (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));

create policy "Admin can update payments" on public.payments
  for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));

-- subscriptions: admin access
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users or admins can view subscriptions" on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id OR public.is_any_admin(auth.uid()));

create policy "Admin can update subscriptions" on public.subscriptions
  for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));

-- audit_logs: admin can view all
drop policy if exists "Users can view own audit logs" on public.audit_logs;
create policy "Users or admins can view audit logs" on public.audit_logs
  for select to authenticated
  using (auth.uid() = user_id OR public.is_any_admin(auth.uid()));

-- Allow admin to insert audit logs
create policy "Admins can insert audit logs" on public.audit_logs
  for insert to authenticated
  with check (public.is_any_admin(auth.uid()));

-- 8. Admin audit logging helper
create or replace function public.log_admin_action(
  p_action text,
  p_table_name text,
  p_record_id uuid default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  values (auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values);
end;
$$;
