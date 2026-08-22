-- Forms can now be hard-deleted by their owner or an admin - but only from
-- the form's own Settings tab, and only when nothing depends on it yet.
-- The existing submissions.form_id RESTRICT foreign key (20260821000001)
-- already enforces the safety property this platform was built around: a
-- form with real submission data can never be deleted, only archived. This
-- migration doesn't touch that constraint - it only opens the door for
-- forms that have zero submissions (drafts, mistakes, test forms).

create policy forms_delete_owner on forms for delete
  to authenticated using (owner_id = auth.uid());
create policy forms_delete_admin on forms for delete
  to authenticated using (is_admin(auth.uid()));

grant delete on forms to authenticated;
