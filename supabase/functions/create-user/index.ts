// Admin-only account creation. There is no public self-signup - accounts
// are created by an ESN Form Admin, who sets the new member's initial
// password directly (communicated out-of-band). Creating a user requires
// the Admin API (service_role), which can't be called from the browser, so
// this function does two things a client-side call couldn't: verifies the
// caller is actually an admin (by re-checking their own profile under their
// own auth, not just trusting a valid JWT), then performs the privileged
// auth.admin.createUser call.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { corsHeaders } from '../_shared/cors.ts'

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ success: false, error: 'Missing Authorization header' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return jsonResponse({ success: false, error: 'Not authenticated' }, 401)
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .single()

  if (profileError || callerProfile?.role !== 'admin') {
    return jsonResponse({ success: false, error: 'Only an ESN Form Admin can create accounts' }, 403)
  }

  let payload: { email?: unknown; password?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { email, password } = payload
  if (typeof email !== 'string' || !email || typeof password !== 'string' || password.length < 6) {
    return jsonResponse(
      { success: false, error: 'A valid email and a password of at least 6 characters are required' },
      400,
    )
  }

  const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return jsonResponse({ success: false, error: createError?.message ?? 'Failed to create the account' }, 400)
  }

  return jsonResponse({ success: true, userId: created.user.id, email: created.user.email }, 201)
})
