// Admin-only operations. Every function here is only meaningful for a user
// whose profiles.role is 'admin' - RLS is what actually enforces that, not
// this file. A non-admin calling these degrades safely (they just get back
// whatever they'd already see under the owner-only policies), it's not a
// security boundary in itself.
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { FormRow, ProfileRow } from './database.types'

export async function getCurrentUserProfile(): Promise<ProfileRow | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single()
  if (error) throw error
  return data
}

export async function listUsers(): Promise<ProfileRow[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function setUserRole(userId: string, role: ProfileRow['role']): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function listAllFormsAsAdmin(): Promise<FormRow[]> {
  const { data, error } = await supabase.from('forms').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

// There is no self-signup - an admin sets the new member's initial password
// directly here, and communicates it out-of-band. Creating a user requires
// the Admin API (service_role), so this goes through the create-user Edge
// Function rather than a direct table/auth call.
export async function createUserAsAdmin(email: string, password: string): Promise<{ userId: string; email: string }> {
  const { data, error } = await supabase.functions.invoke('create-user', { body: { email, password } })
  if (error) throw await toFriendlyError(error, 'Failed to create the account')
  return data as { userId: string; email: string }
}

// Editing an account's email/password also goes through the Admin API -
// pass only the field(s) that changed, the Edge Function updates whichever
// were provided.
export async function updateUserAsAdmin(
  userId: string,
  updates: { email?: string; password?: string },
): Promise<{ userId: string; email: string }> {
  const { data, error } = await supabase.functions.invoke('update-user', { body: { userId, ...updates } })
  if (error) throw await toFriendlyError(error, 'Failed to update the account')
  return data as { userId: string; email: string }
}

export async function deleteUserAsAdmin(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-user', { body: { userId } })
  if (error) throw await toFriendlyError(error, 'Failed to delete the account')
}

// Force-deletes a form even if it has submissions - clears the submissions
// first, then the form, via the service-role client (which is why this is
// an Edge Function, not a plain RLS-gated table delete like formsApi.ts's
// owner-facing deleteForm, which stays blocked by design when responses
// exist).
export async function adminDeleteForm(formId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-form', { body: { formId } })
  if (error) throw await toFriendlyError(error, 'Failed to delete the form')
}

async function toFriendlyError(error: unknown, fallback: string): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string }
      if (body.error) return new Error(body.error)
    } catch {
      // response body wasn't valid JSON - fall back to the generic message
    }
    return new Error(fallback)
  }
  return error instanceof Error ? error : new Error(fallback)
}
