// Admin-only account creation. There is no public self-signup - accounts
// are created by an ESN Form Admin, who sets the new member's initial
// password directly (communicated out-of-band). Creating a user requires
// the Admin API (service_role), which can't be called from the browser, so
// this function does two things a client-side call couldn't: verifies the
// caller is actually an admin (by re-checking their own profile under their
// own auth, not just trusting a valid JWT), then performs the privileged
// auth.admin.createUser call.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { validatePassword } from '../_shared/passwordPolicy.ts'

// Unlike submit-form (intentionally public, may legitimately be called
// cross-origin), this function is admin-only and never meant to be called
// from anywhere but the app's own frontend - scope it to that origin via
// an env secret instead of the shared wildcard cors.ts. Falls back to '*'
// only so the function keeps working before ALLOWED_ORIGIN is configured;
// set it with `supabase secrets set ALLOWED_ORIGIN=https://<production-domain>`.
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
  if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
    return jsonResponse({ success: false, error: 'A valid email and password are required' }, 400)
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return jsonResponse({ success: false, error: passwordError }, 400)
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
