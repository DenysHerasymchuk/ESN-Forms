-- The integrations feature (webhook/email/discord dispatch on submission)
-- was fully built - schema, RLS, dispatch trigger, and an edge function -
-- but never got a builder UI to configure an integration for a form, so
-- nothing in the frontend has ever queried these tables. Removing it also
-- closes a real gap: dispatch-integrations had no in-function check of its
-- own caller identity, relying entirely on the trigger never being called
-- by anyone else - deleting the function removes that gap rather than
-- patching it.
drop trigger if exists submissions_dispatch_integrations on submissions;
drop function if exists dispatch_integrations_webhook();

drop table if exists integration_deliveries;
drop table if exists integrations;
drop table if exists field_types;
drop table if exists integration_providers;
