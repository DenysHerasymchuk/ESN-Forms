alter table forms enable row level security;
alter table submissions enable row level security;
alter table integrations enable row level security;
alter table integration_deliveries enable row level security;
alter table field_types enable row level security;
alter table integration_providers enable row level security;

create policy forms_select_owner on forms for select
  to authenticated using (owner_id = auth.uid());
create policy forms_select_published on forms for select
  using (status = 'published');
create policy forms_insert_owner on forms for insert
  to authenticated with check (owner_id = auth.uid());
create policy forms_update_owner on forms for update
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- No delete policy for any role: forms are never hard-deleted, only archived,
-- so the submissions.form_id RESTRICT foreign key always holds.

create policy submissions_select_owner on submissions for select
  to authenticated using (
    exists (select 1 from forms where forms.id = submissions.form_id and forms.owner_id = auth.uid())
  );
-- No anon select, and no insert/update/delete policy for any client role.
-- Submissions are written only by a trusted service-role function that
-- validates answers against the form's field schema before inserting.

-- integrations holds provider config (webhook URLs, tokens); it's a separate
-- table rather than a column on forms because forms has a public select policy
-- for published forms, and RLS can't restrict individual columns on a row.
create policy integrations_owner_all on integrations for all
  to authenticated using (
    exists (select 1 from forms where forms.id = integrations.form_id and forms.owner_id = auth.uid())
  ) with check (
    exists (select 1 from forms where forms.id = integrations.form_id and forms.owner_id = auth.uid())
  );

create policy integration_deliveries_select_owner on integration_deliveries for select
  to authenticated using (
    exists (
      select 1 from integrations join forms on forms.id = integrations.form_id
      where integrations.id = integration_deliveries.integration_id and forms.owner_id = auth.uid()
    )
  );
-- No client insert/update: delivery rows are written only by the dispatch function.

create policy catalog_public_read_field_types on field_types for select using (true);
create policy catalog_public_read_integration_providers on integration_providers for select using (true);
-- No insert/update/delete policies: these are reference data managed by migrations.
