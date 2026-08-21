// Thin wrapper around supabase-js for the form-owner and public-submission
// flows described in the platform's backend-flow design. Each function maps
// to exactly one Postgres RPC call or one RLS-gated table operation — no
// business logic lives here beyond that mapping.
import { supabase } from './supabaseClient'
import type { Field } from './formField'
import type { FormRow, FormStatus, SubmissionRow } from './database.types'

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

export async function createForm(name: string, description: string | null, fields: Field[] = []): Promise<FormRow> {
  const { data, error } = await supabase.rpc('create_form', {
    p_name: name,
    p_description: description,
    p_fields: fields,
  })
  if (error) throw error
  return data
}

// forms has two SELECT policies (owner sees their own of any status, anyone
// sees published ones) that Postgres combines with OR, so an unfiltered
// query would also return other owners' published forms. Filtering by
// owner_id here is what actually scopes the result to "my forms".
export async function listOwnerForms(): Promise<FormRow[]> {
  const ownerId = await requireUserId()
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOwnerForm(formId: string): Promise<FormRow> {
  const { data, error } = await supabase.from('forms').select('*').eq('id', formId).single()
  if (error) throw error
  return data
}

export async function updateFormFields(formId: string, fields: Field[]): Promise<FormRow> {
  const { data, error } = await supabase.from('forms').update({ fields }).eq('id', formId).select().single()
  if (error) throw error
  return data
}

export async function updateFormMeta(
  formId: string,
  meta: { name: string; description: string | null },
): Promise<FormRow> {
  const { data, error } = await supabase.from('forms').update(meta).eq('id', formId).select().single()
  if (error) throw error
  return data
}

async function setFormStatus(formId: string, status: FormStatus): Promise<FormRow> {
  const { data, error } = await supabase.from('forms').update({ status }).eq('id', formId).select().single()
  if (error) throw error
  return data
}

export const publishForm = (formId: string) => setFormStatus(formId, 'published')
export const archiveForm = (formId: string) => setFormStatus(formId, 'archived')
// Restoring from archived can go back to either draft or published — the
// guard_form_status_transition trigger enforces that both are legal moves.
export const restoreForm = (formId: string, to: 'draft' | 'published') => setFormStatus(formId, to)

export async function getPublishedFormBySlug(slug: string): Promise<FormRow | null> {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listSubmissions(formId: string): Promise<SubmissionRow[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data
}
