-- forms.fields is a JSONB array (not a child table): array order is field order,
-- and edits are one atomic UPDATE. submissions.answers is a JSONB object keyed by
-- field id (not EAV): the dominant access pattern is "read one submission whole".
-- field_types / integration_providers are catalog tables (not native enums), so new
-- field types/providers can be added without a migration.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists unaccent;   -- slug normalization (used by create_form, step 4)
create extension if not exists pg_net;     -- async HTTP from triggers (integration dispatch, step 8)

create type form_status as enum ('draft', 'published', 'archived');

create table field_types (
  id            text primary key,   -- 'text','email','number','date','select','radio','checkbox','textarea','url','acknowledge', ...
  label         text not null,
  config_schema jsonb,              -- documents expected config keys (informational)
  is_active     boolean not null default true
);

create table integration_providers (
  id        text primary key,       -- 'google_sheets','webhook','email','discord', ...
  label     text not null,
  is_active boolean not null default true
);

create table forms (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  slug         text not null,
  description  text,
  status       form_status not null default 'draft',
  fields       jsonb not null default '[]'::jsonb,
  settings     jsonb not null default '{}'::jsonb,  -- e.g. { closesAt, successMessage, notifyEmails }
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  archived_at  timestamptz,
  constraint forms_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create unique index forms_slug_key on forms (lower(slug));
create index forms_owner_status_idx on forms (owner_id, status);

create table submissions (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references forms(id) on delete restrict,
  answers      jsonb not null default '{}'::jsonb,  -- { "firstName": "Jane", "hostUniversity": "KU Leuven campus Geel" }
  submitted_at timestamptz not null default now()
);
create index submissions_form_submitted_idx on submissions (form_id, submitted_at desc);

create table integrations (
  id         uuid primary key default gen_random_uuid(),
  form_id    uuid not null references forms(id) on delete cascade,
  provider   text not null references integration_providers(id),
  enabled    boolean not null default true,
  config     jsonb not null default '{}'::jsonb,  -- provider-specific, e.g. {url, headers} / {to:[...]} / {webhookUrl}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index integrations_form_idx on integrations (form_id);

create table integration_deliveries (
  id                uuid primary key default gen_random_uuid(),
  submission_id     uuid not null references submissions(id) on delete cascade,
  integration_id    uuid not null references integrations(id) on delete cascade,
  status            text not null default 'pending' check (status in ('pending','success','failed')),
  attempt_count     int not null default 0,
  last_attempted_at timestamptz,
  last_error        text,
  created_at        timestamptz not null default now()
);
create index integration_deliveries_submission_idx on integration_deliveries (submission_id);
create index integration_deliveries_integration_status_idx on integration_deliveries (integration_id, status);
