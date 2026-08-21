-- service_role has BYPASSRLS, but that only skips Row-Level Security policy
-- evaluation - it still needs the base table-level GRANTs Postgres checks
-- before RLS is even considered, same as any other role. This is the
-- service_role counterpart to migration 20260821000010 (anon/authenticated):
-- apparently "Automatically expose new tables: off" withheld default
-- privileges from service_role on these tables too. service_role is the
-- fully trusted key used only inside Edge Functions, never exposed to a
-- client, so full CRUD here is appropriate (unlike the deliberately
-- delete-less grants given to authenticated on forms).
grant select, insert, update, delete on forms to service_role;
grant select, insert, update, delete on submissions to service_role;
grant select, insert, update, delete on integrations to service_role;
grant select, insert, update, delete on integration_deliveries to service_role;
grant select, insert, update, delete on field_types to service_role;
grant select, insert, update, delete on integration_providers to service_role;
grant select, insert, update, delete on profiles to service_role;

grant execute on function create_form(text, text, jsonb) to service_role;
grant execute on function is_admin(uuid) to service_role;
