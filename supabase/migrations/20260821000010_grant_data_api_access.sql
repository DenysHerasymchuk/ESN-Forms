-- With "Automatically expose new tables" off, Postgres denies anon/
-- authenticated at the table-grant level before RLS policies are even
-- evaluated ("permission denied for table X"), regardless of how permissive
-- the policies are. These grants are the ceiling; RLS policies (already in
-- place) remain the actual per-row access control within that ceiling.

grant select on forms to anon, authenticated;
grant insert, update on forms to authenticated;
-- no delete grant, ever: forms are never hard-deleted (see submissions.form_id
-- RESTRICT and the deliberate absence of a delete policy on forms).

grant select on submissions to authenticated;
-- no anon/authenticated insert/update/delete: submissions are written only
-- by the submit-form Edge Function via the service_role key, which bypasses
-- grants and RLS entirely.

grant select, insert, update, delete on integrations to authenticated;
grant select on integration_deliveries to authenticated;

grant select on field_types to anon, authenticated;
grant select on integration_providers to anon, authenticated;

grant select, update on profiles to authenticated;
-- no insert grant: profiles rows are created only by the handle_new_user
-- trigger (security definer, runs as the function owner regardless of grants).

grant execute on function create_form(text, text, jsonb) to authenticated;
grant execute on function is_admin(uuid) to authenticated;
