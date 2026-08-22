import { createClient } from 'npm:@supabase/supabase-js@2.112.3'

export type AdminAuthResult = { ok: true; userId: string } | { ok: false; status: number; error: string }

// Re-verifies the caller is actually an admin server-side, under their own
// auth (not just trusting a client-sent role flag) - shared by every
// admin-only function that needs the privileged service-role client for
// something an RLS policy alone can't do.
export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { ok: false, status: 401, error: 'Missing Authorization header' }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) {
    return { ok: false, status: 401, error: 'Not authenticated' }
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .single()

  if (profileError || callerProfile?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Only an ESN Form Admin can do this' }
  }

  return { ok: true, userId: callerData.user.id }
}
