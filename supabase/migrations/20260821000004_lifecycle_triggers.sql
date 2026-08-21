-- Restricts forms.status changes to the allowed lifecycle transitions, and
-- requires at least one field before a form can be published.
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

create trigger forms_guard_status
  before update of status on forms
  for each row execute function guard_form_status_transition();

-- Once a form has submissions, protects the parts of its field definitions
-- that historical answers depend on: a field's id and type can't change, and
-- an option value can't be removed while any submission still references it.
-- Cosmetic edits (labels, help text, new fields, new options, reordering,
-- marking a field deprecated) remain unrestricted.
create or replace function guard_form_field_mutation()
returns trigger language plpgsql as $$
declare
  old_field         jsonb;
  new_field         jsonb;
  old_field_id      text;
  old_field_type    text;
  used_option_values text[];
  new_option_values  text[];
  missing_option    text;
begin
  if not exists (select 1 from submissions where form_id = new.id) then
    return new;
  end if;

  if old.fields = new.fields then
    return new;
  end if;

  for old_field in select jsonb_array_elements(old.fields)
  loop
    old_field_id := old_field ->> 'id';
    old_field_type := old_field ->> 'type';

    select value into new_field
    from jsonb_array_elements(new.fields) as value
    where value ->> 'id' = old_field_id;

    if new_field is null then
      raise exception 'Cannot remove field "%" because submissions already reference it', old_field_id;
    end if;

    if (new_field ->> 'type') is distinct from old_field_type then
      raise exception 'Cannot change the type of field "%" because submissions already reference it', old_field_id;
    end if;

    if old_field_type in ('select', 'radio', 'checkbox') then
      select array_agg(distinct v)
      into used_option_values
      from submissions,
           jsonb_array_elements_text(
             case jsonb_typeof(submissions.answers -> old_field_id)
               when 'array' then submissions.answers -> old_field_id
               else jsonb_build_array(submissions.answers -> old_field_id)
             end
           ) as v
      where submissions.form_id = new.id
        and submissions.answers ? old_field_id
        and submissions.answers -> old_field_id is not null;

      select array_agg(option ->> 'value')
      into new_option_values
      from jsonb_array_elements(coalesce(new_field -> 'config' -> 'options', '[]'::jsonb)) as option;

      if used_option_values is not null then
        select v into missing_option
        from unnest(used_option_values) as v
        where v <> all(coalesce(new_option_values, array[]::text[]))
        limit 1;

        if missing_option is not null then
          raise exception 'Cannot remove option "%" from field "%" because submissions already reference it',
            missing_option, old_field_id;
        end if;
      end if;
    end if;
  end loop;

  return new;
end;
$$;

create trigger forms_guard_field_mutation
  before update of fields on forms
  for each row execute function guard_form_field_mutation();
