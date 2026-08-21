-- Generates a URL slug from the form name and retries with a numeric suffix
-- on collision, inside one transaction, so slug uniqueness can't race between
-- a client-side check and the insert.
create or replace function create_form(p_name text, p_description text, p_fields jsonb)
returns forms
language plpgsql
security invoker
as $$
declare
  base_slug text := trim(both '-' from regexp_replace(lower(unaccent(p_name)), '[^a-z0-9]+', '-', 'g'));
  candidate text;
  attempt   int := 0;
  result    forms;
begin
  loop
    candidate := case when attempt = 0 then base_slug else base_slug || '-' || (attempt + 1) end;
    begin
      insert into forms (owner_id, name, slug, description, fields, status)
      values (auth.uid(), p_name, candidate, p_description, coalesce(p_fields, '[]'::jsonb), 'draft')
      returning * into result;
      return result;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 50 then
        raise exception 'Could not generate a unique slug for %', p_name;
      end if;
    end;
  end loop;
end;
$$;
