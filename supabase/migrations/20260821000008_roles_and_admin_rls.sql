-- Adds a platform-wide admin role on top of the existing owner-only model.
-- profiles mirrors just enough of auth.users (id, email) to let an admin
-- browse/manage accounts without needing the service-role-only GoTrue admin
-- API from the client.
create type user_role as enum ('member', 'admin');

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       user_role not null default 'member',
  created_at timestamptz not null default now()
);

-- Populates profiles automatically on signup, defaulting every new account
-- to 'member'. Runs as the function owner (bypassing RLS), which is the
-- standard way to let an auth.users trigger write into public without
-- granting insert on profiles to end users directly.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- security definer so this can be called from other tables' RLS policies
-- without re-triggering RLS on profiles itself (which would otherwise
-- recurse: checking is_admin() would re-evaluate a profiles policy that
-- itself calls is_admin()).
create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

alter table profiles enable row level security;

create policy profiles_select_own on profiles for select
  to authenticated using (id = auth.uid());
create policy profiles_select_admin on profiles for select
  to authenticated using (is_admin(auth.uid()));
-- Only an admin can change a role, and only via UPDATE - never through the
-- signup trigger, so nobody can grant themselves admin by signing up.
create policy profiles_update_admin on profiles for update
  to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Admin bypass alongside the existing owner-only policies (Postgres ORs
-- multiple permissive policies together for the same command). Deliberately
-- no admin DELETE policy on forms: forms are never hard-deleted, even by an
-- admin, matching the existing submissions.form_id RESTRICT guarantee.
create policy forms_admin_select on forms for select
  to authenticated using (is_admin(auth.uid()));
create policy forms_admin_update on forms for update
  to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy submissions_admin_select on submissions for select
  to authenticated using (is_admin(auth.uid()));

create policy integrations_admin_all on integrations for all
  to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy integration_deliveries_admin_select on integration_deliveries for select
  to authenticated using (is_admin(auth.uid()));
