-- forms.settings was documented (see 20260821000001) as eventually holding
-- { closesAt, successMessage, notifyEmails } - i.e. internal staff email
-- addresses - but forms_select_published grants a public SELECT of the
-- entire row, and Postgres RLS can't restrict individual columns. This is
-- the exact problem `integrations` was already split into its own table to
-- avoid (see that table's own comment); settings gets the same treatment
-- before anything actually gets stored in it. settings is unread/unwritten
-- anywhere in the app today, so this is a no-op from the UI's perspective.
alter table forms drop column settings;

create table form_settings (
  form_id    uuid primary key references forms(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table form_settings enable row level security;

create policy form_settings_owner_all on form_settings for all
  to authenticated using (
    exists (select 1 from forms where forms.id = form_settings.form_id and forms.owner_id = auth.uid())
  ) with check (
    exists (select 1 from forms where forms.id = form_settings.form_id and forms.owner_id = auth.uid())
  );

create policy form_settings_admin_all on form_settings for all
  to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
-- No public/anon policy at all - unlike forms, this table is never meant
-- to be readable by a respondent filling out the public form.

grant select, insert, update, delete on form_settings to authenticated;
grant select, insert, update, delete on form_settings to service_role;
