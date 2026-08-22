-- Forms are always created with the placeholder name "Untitled form" (the
-- builder no longer prompts for a real name up front - see DashboardPage),
-- so a name-derived slug was permanently stuck as "untitled-form"/"-2"/"-3"
-- etc. even after the owner renamed the form. The public link is now just
-- the form's own id - already unique by construction, so the retry-on-
-- collision loop and unaccent() normalization this replaces are no longer
-- needed either.
create or replace function create_form(p_name text, p_description text, p_fields jsonb)
returns forms
language plpgsql
security invoker
as $$
declare
  new_id uuid := gen_random_uuid();
  result forms;
begin
  insert into forms (id, owner_id, name, slug, description, fields, status)
  values (new_id, auth.uid(), p_name, new_id::text, p_description, coalesce(p_fields, '[]'::jsonb), 'draft')
  returning * into result;
  return result;
end;
$$;
