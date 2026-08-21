-- Re-checks the same rules the submit-form Edge Function already enforces
-- (required / type / min-max / pattern / allowed-options), as a second,
-- independent layer. The Edge Function is currently the only insert path
-- into submissions, but this protects data integrity against any future
-- path (e.g. a bulk-import tool) that writes to the table directly.
create or replace function validate_submission_answers()
returns trigger language plpgsql as $$
declare
  form_record   forms;
  field         jsonb;
  field_id      text;
  field_type    text;
  required      boolean;
  deprecated    boolean;
  config        jsonb;
  array_value   jsonb;
  text_value    text;
  numeric_value numeric;
  option_values text[];
begin
  select * into form_record from forms where id = new.form_id;

  if form_record is null then
    raise exception 'Submission references a form that does not exist';
  end if;

  if form_record.status <> 'published' then
    raise exception 'Cannot submit to a form that is not published';
  end if;

  for field in select jsonb_array_elements(form_record.fields)
  loop
    field_id := field ->> 'id';
    field_type := field ->> 'type';
    required := coalesce((field ->> 'required')::boolean, false);
    deprecated := coalesce((field ->> 'deprecated')::boolean, false);
    config := coalesce(field -> 'config', '{}'::jsonb);

    if deprecated then
      continue;
    end if;

    if field_type = 'checkbox' then
      array_value := new.answers -> field_id;

      if required and (array_value is null or jsonb_array_length(array_value) = 0) then
        raise exception 'Field "%" is required', field_id;
      end if;

      if array_value is not null then
        select array_agg(option ->> 'value') into option_values
        from jsonb_array_elements(coalesce(config -> 'options', '[]'::jsonb)) as option;

        if exists (
          select 1 from jsonb_array_elements_text(array_value) as v
          where v <> all(coalesce(option_values, array[]::text[]))
        ) then
          raise exception 'Field "%" contains a value that is not an allowed option', field_id;
        end if;
      end if;

      continue;
    end if;

    text_value := new.answers ->> field_id;

    if required and (text_value is null or btrim(text_value) = '') then
      raise exception 'Field "%" is required', field_id;
    end if;

    if text_value is null or btrim(text_value) = '' then
      continue;
    end if;

    if field_type = 'email' and text_value !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      raise exception 'Field "%" must be a valid email address', field_id;
    end if;

    if field_type = 'url' and text_value !~ '^[a-zA-Z][a-zA-Z0-9+.-]*://' then
      raise exception 'Field "%" must be a valid URL', field_id;
    end if;

    if field_type = 'number' then
      begin
        numeric_value := text_value::numeric;
      exception when others then
        raise exception 'Field "%" must be a number', field_id;
      end;
      if config ? 'min' and numeric_value < (config ->> 'min')::numeric then
        raise exception 'Field "%" must be at least %', field_id, config ->> 'min';
      end if;
      if config ? 'max' and numeric_value > (config ->> 'max')::numeric then
        raise exception 'Field "%" must be at most %', field_id, config ->> 'max';
      end if;
    end if;

    if field_type = 'date' then
      begin
        perform text_value::date;
      exception when others then
        raise exception 'Field "%" must be a valid date', field_id;
      end;
    end if;

    if field_type in ('text', 'textarea') then
      if config ? 'maxLength' and length(text_value) > (config ->> 'maxLength')::int then
        raise exception 'Field "%" must be at most % characters', field_id, config ->> 'maxLength';
      end if;
      if config ? 'minLength' and length(text_value) < (config ->> 'minLength')::int then
        raise exception 'Field "%" must be at least % characters', field_id, config ->> 'minLength';
      end if;
    end if;

    if field_type in ('select', 'radio') then
      select array_agg(option ->> 'value') into option_values
      from jsonb_array_elements(coalesce(config -> 'options', '[]'::jsonb)) as option;

      if not (
        text_value = any(coalesce(option_values, array[]::text[]))
        or (coalesce((config ->> 'allowOther')::boolean, false) and text_value = (config ->> 'otherOptionValue'))
      ) then
        raise exception 'Field "%" must be one of the allowed options', field_id;
      end if;
    end if;

    if field_type = 'acknowledge' and config ? 'value' and text_value <> (config ->> 'value') then
      raise exception 'Field "%" must be acknowledged', field_id;
    end if;
  end loop;

  return new;
end;
$$;

create trigger submissions_validate_answers
  before insert on submissions
  for each row execute function validate_submission_answers();
