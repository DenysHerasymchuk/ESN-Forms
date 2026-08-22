// Regular owner deletion (formsApi.ts's deleteForm, RLS-gated) still goes
// through a plain DELETE, which submissions.form_id ON DELETE RESTRICT
// blocks whenever a form has real responses - that guarantee stays intact
// everywhere else in the app. This function is a separate, explicitly
// admin-only escape hatch: it clears a form's submissions first (using the
// service-role client, which already has delete grants on both tables),
// then deletes the form itself, so an admin can remove a form even when
// RESTRICT would otherwise block it.
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

  let payload: { formId?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { formId } = payload
  if (typeof formId !== 'string' || !formId) {
    return jsonResponse({ success: false, error: 'A "formId" is required' }, 400)
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { error: submissionsError } = await adminClient.from('submissions').delete().eq('form_id', formId)
  if (submissionsError) {
    console.error('delete-form: failed to delete submissions', submissionsError)
    return jsonResponse({ success: false, error: 'Failed to delete the form' }, 500)
  }

  const { error: formError } = await adminClient.from('forms').delete().eq('id', formId)
  if (formError) {
    console.error('delete-form: failed to delete form', formError)
    return jsonResponse({ success: false, error: 'Failed to delete the form' }, 500)
  }

  return jsonResponse({ success: true }, 200)
})
