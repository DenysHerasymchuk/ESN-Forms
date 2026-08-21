-- Fires after a submission commits, asynchronously, outside the insert's
-- own transaction, so a slow or failing integration can never affect the
-- respondent's already-returned success response. Reads its target URL and
-- auth key from Vault rather than hardcoding them, since those differ per
-- environment (local/staging/prod) and shouldn't live in migration history.
--
-- One-time setup per environment, run in the SQL editor after deploying the
-- dispatch-integrations function:
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'edge_function_base_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
create extension if not exists supabase_vault;

create or replace function dispatch_integrations_webhook()
returns trigger language plpgsql as $$
declare
  function_url      text;
  service_role_key  text;
  request_id        bigint;
begin
  select decrypted_secret into function_url
  from vault.decrypted_secrets where name = 'edge_function_base_url';

  select decrypted_secret into service_role_key
  from vault.decrypted_secrets where name = 'service_role_key';

  if function_url is null or service_role_key is null then
    raise warning 'dispatch_integrations_webhook: missing edge_function_base_url or service_role_key vault secret; skipping dispatch for submission %', new.id;
    return new;
  end if;

  select net.http_post(
    url := function_url || '/dispatch-integrations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('submission_id', new.id)
  ) into request_id;

  return new;
end;
$$;

create trigger submissions_dispatch_integrations
  after insert on submissions
  for each row execute function dispatch_integrations_webhook();
