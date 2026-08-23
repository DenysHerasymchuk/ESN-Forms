-- Security hardening, two related fixes:
--
-- 1. is_admin(uid uuid) took an arbitrary target uuid and was granted to
--    authenticated, so any logged-in member could call
--    `rpc('is_admin', { uid: '<someone-else>' })` and enumerate other
--    accounts' admin status. It's confirmed unused from the frontend (only
--    ever called from within RLS policies as is_admin(auth.uid())), so it's
--    redefined with no argument at all - it always checks the real caller,
--    which makes the enumeration impossible regardless of input.
--
-- 2. Every RLS policy below called auth.uid() (or is_admin(auth.uid()))
--    directly in USING/WITH CHECK, which Postgres re-evaluates per row
--    instead of once per statement. Wrapping it as (select auth.uid())
--    lets the planner treat it as a stable initplan instead. ALTER POLICY
--    is used (not drop+recreate) so there's no window without a policy.

-- Create the replacement first (different signature, coexists with the old
-- one) so policies can be switched over before the old function is dropped.
create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin');
$$;

grant execute on function is_admin() to authenticated, service_role;

-- Admin-check policies: switch from is_admin(auth.uid()) to is_admin().
alter policy forms_delete_admin on forms
  using (is_admin());
alter policy forms_admin_select on forms
  using (is_admin());
alter policy forms_admin_update on forms
  using (is_admin()) with check (is_admin());
alter policy submissions_admin_select on submissions
  using (is_admin());
alter policy profiles_select_admin on profiles
  using (is_admin());
alter policy profiles_update_admin on profiles
  using (is_admin()) with check (is_admin());
alter policy form_settings_admin_all on form_settings
  using (is_admin()) with check (is_admin());

-- Nothing references is_admin(uuid) anymore - safe to drop.
drop function is_admin(uuid);

-- Owner-check policies: wrap the remaining bare auth.uid() calls.
alter policy forms_select_owner on forms
  using (owner_id = (select auth.uid()));
alter policy forms_insert_owner on forms
  with check (owner_id = (select auth.uid()));
alter policy forms_update_owner on forms
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
alter policy forms_delete_owner on forms
  using (owner_id = (select auth.uid()));
alter policy submissions_select_owner on submissions
  using (
    exists (select 1 from forms where forms.id = submissions.form_id and forms.owner_id = (select auth.uid()))
  );
alter policy profiles_select_own on profiles
  using (id = (select auth.uid()));
alter policy form_settings_owner_all on form_settings
  using (
    exists (select 1 from forms where forms.id = form_settings.form_id and forms.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from forms where forms.id = form_settings.form_id and forms.owner_id = (select auth.uid()))
  );
