// Admin-only account deletion. Needs the Admin API (service_role), which
// can't be called from the browser.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { requireAdmin } from '../_shared/requireAdmin.ts'

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

  let payload: { userId?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { userId } = payload
  if (typeof userId !== 'string' || !userId) {
    return jsonResponse({ success: false, error: 'A "userId" is required' }, 400)
  }

  if (userId === auth.userId) {
    return jsonResponse({ success: false, error: "You can't delete your own account" }, 400)
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // forms.owner_id -> auth.users(id) is ON DELETE CASCADE, so deleting the
  // user would cascade-delete their forms too - but submissions.form_id is
  // ON DELETE RESTRICT, which would make that cascade fail if any of this
  // user's forms have responses. Clear those first so the deletion always
  // succeeds, the same way delete-form does for a single form.
  const { data: ownedForms, error: formsLookupError } = await adminClient
    .from('forms')
    .select('id')
    .eq('owner_id', userId)

  if (formsLookupError) {
    console.error('delete-user: failed to look up owned forms', formsLookupError)
    return jsonResponse({ success: false, error: 'Failed to delete the account' }, 500)
  }

  const formIds = (ownedForms ?? []).map((form) => form.id as string)
  if (formIds.length > 0) {
    const { error: submissionsError } = await adminClient.from('submissions').delete().in('form_id', formIds)
    if (submissionsError) {
      console.error('delete-user: failed to delete submissions for owned forms', submissionsError)
      return jsonResponse({ success: false, error: 'Failed to delete the account' }, 500)
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    return jsonResponse({ success: false, error: deleteError.message }, 400)
  }

  return jsonResponse({ success: true }, 200)
})
