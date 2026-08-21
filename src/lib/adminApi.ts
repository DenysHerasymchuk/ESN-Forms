// Admin-only operations. Every function here is only meaningful for a user
// whose profiles.role is 'admin' - RLS is what actually enforces that, not
// this file. A non-admin calling these degrades safely (they just get back
// whatever they'd already see under the owner-only policies), it's not a
// security boundary in itself.
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
