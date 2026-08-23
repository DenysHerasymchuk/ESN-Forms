// Admin-only account editing (email and/or password). Like create-user,
// this needs the Admin API (service_role), which can't be called from the
// browser.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { requireAdmin } from '../_shared/requireAdmin.ts'
import { validatePassword } from '../_shared/passwordPolicy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return jsonResponse({ success: false, error: auth.error }, auth.status)
  }

  let payload: { userId?: unknown; email?: unknown; password?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { userId, email, password } = payload
  if (typeof userId !== 'string' || !userId) {
    return jsonResponse({ success: false, error: 'A "userId" is required' }, 400)
  }

  const hasEmail = typeof email === 'string' && email.trim().length > 0
  const hasPassword = typeof password === 'string' && password.length > 0

  if (!hasEmail && !hasPassword) {
    return jsonResponse({ success: false, error: 'Provide a new email and/or password' }, 400)
  }
  if (hasPassword) {
    const passwordError = validatePassword(password as string)
    if (passwordError) {
      return jsonResponse({ success: false, error: passwordError }, 400)
    }
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const updates: { email?: string; password?: string } = {}
  if (hasEmail) updates.email = (email as string).trim()
  if (hasPassword) updates.password = password as string

  const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(userId, updates)

  if (updateError || !updated.user) {
    return jsonResponse({ success: false, error: updateError?.message ?? 'Failed to update the account' }, 400)
  }

  // profiles.email only ever gets set once, at signup, by the
  // handle_new_user trigger - nothing keeps it in sync afterward, so update
  // it here too or the admin Users list would show a stale address.
  if (hasEmail) {
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ email: updated.user.email })
      .eq('id', userId)
    if (profileUpdateError) {
      console.error('update-user: failed to sync profiles.email', profileUpdateError)
    }
  }

  return jsonResponse({ success: true, userId: updated.user.id, email: updated.user.email }, 200)
})
