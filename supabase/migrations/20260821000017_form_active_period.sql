-- Every form needs an explicit active period (when it's open for
-- responses) before it can leave draft - published/archived without one
-- would leave respondents (and anyone printing an attendance sheet) with
-- no way to know whether the form is still meant to be live. event_date is
-- separate and optional: the period is about when the FORM accepts
-- responses, event_date is about when the underlying event itself happens
-- (often related, but not always the same window).
alter table forms add column opens_at timestamptz;
alter table forms add column closes_at timestamptz;
alter table forms add column event_date date;

alter table forms add constraint forms_period_order
  check (opens_at is null or closes_at is null or closes_at > opens_at);

create or replace function guard_form_status_transition()
returns trigger language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if (old.status, new.status) not in (
    ('draft', 'published'), ('draft', 'archived'),
    ('published', 'archived'),
    ('archived', 'published'), ('archived', 'draft')
  ) then
    raise exception 'Illegal form status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'published' and jsonb_array_length(new.fields) = 0 then
    raise exception 'Cannot publish a form with no fields';
  end if;

  if new.status <> 'draft' and (new.opens_at is null or new.closes_at is null) then
    raise exception 'Set an active period (opens and closes date) before publishing or archiving this form';
  end if;

  if new.status = 'published' and old.published_at is null then
    new.published_at := now();
  end if;

  if new.status = 'archived' then
    new.archived_at := now();
  elsif old.status = 'archived' then
    new.archived_at := null;
  end if;

  return new;
end;
$$;
