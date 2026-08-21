-- Reference data for the extensible field-type and integration-provider
-- catalogs (see migration 20260821000001). Adding a new type/provider later
-- is an insert here, not a schema migration.
insert into field_types (id, label) values
  ('text', 'Text'),
  ('email', 'Email'),
  ('url', 'URL'),
  ('number', 'Number'),
  ('date', 'Date'),
  ('select', 'Dropdown'),
  ('radio', 'Radio buttons'),
  ('checkbox', 'Checkboxes'),
  ('textarea', 'Paragraph'),
  ('acknowledge', 'Acknowledgement')
on conflict (id) do nothing;

insert into integration_providers (id, label) values
  ('webhook', 'Webhook'),
  ('discord', 'Discord'),
  ('email', 'Email'),
  ('google_sheets', 'Google Sheets')
on conflict (id) do nothing;
