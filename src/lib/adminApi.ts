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

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let message = 'Failed to create the account'
      try {
        const body = (await error.context.json()) as { error?: string }
        if (body.error) message = body.error
      } catch {
        // response body wasn't valid JSON - fall back to the generic message
      }
      throw new Error(message)
    }
    throw error
  }

  return data as { userId: string; email: string }
}
