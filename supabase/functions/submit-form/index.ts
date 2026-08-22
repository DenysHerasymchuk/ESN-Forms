// Sole public write path into `submissions`. There is no client-facing
// INSERT policy on that table, so this function - running with the
// service role key - is the only way a submission gets stored. It reuses
// the same validator the frontend uses for pre-submit UX, so the rules
// that decide whether an answer is valid are defined once.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { validate, type Answers, type Field } from '../../../src/lib/formField.ts'
import { corsHeaders } from '../_shared/cors.ts'

type SubmitFormPayload = {
  slug?: unknown
  answers?: unknown
  turnstileToken?: unknown
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// The Turnstile widget only proves a real browser passed a challenge in the
// frontend - a script could just skip rendering it and POST here directly,
// so the resulting token is independently re-checked against Cloudflare's
// own endpoint before anything gets written.
async function verifyTurnstileToken(token: string, remoteIp: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY') ?? ''
  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = (await result.json()) as { success?: boolean }
    return data.success === true
  } catch (error) {
    console.error('submit-form: Turnstile verification request failed', error)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  let payload: SubmitFormPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { slug, answers, turnstileToken } = payload
  if (typeof slug !== 'string' || !slug || typeof answers !== 'object' || answers === null) {
    return jsonResponse({ success: false, error: 'A form "slug" and "answers" object are required' }, 400)
  }

  if (typeof turnstileToken !== 'string' || !turnstileToken) {
    return jsonResponse({ success: false, error: 'Verification is required' }, 400)
  }

  // Local dev talks to this same live function (there's no separate local
  // deployment), so a real Turnstile pass would otherwise be required even
  // just to test locally. A matching dev-only secret - never the real
  // TURNSTILE_SECRET_KEY, never committed anywhere - skips the real
  // Cloudflare round-trip entirely. Unset (the default in production) means
  // this branch never matches, so nothing changes for real traffic.
  const devBypassToken = Deno.env.get('TURNSTILE_DEV_BYPASS')
  const isVerified =
    devBypassToken && turnstileToken === devBypassToken
      ? true
      : await verifyTurnstileToken(turnstileToken, req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null)
  if (!isVerified) {
    return jsonResponse({ success: false, error: 'Verification failed. Please try again.' }, 403)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, status, fields')
    .eq('slug', slug)
    .maybeSingle()

  if (formError) {
    console.error('submit-form: failed to look up form', formError)
    return jsonResponse({ success: false, error: 'Failed to look up the form' }, 500)
  }

  if (!form || form.status !== 'published') {
    return jsonResponse({ success: false, error: 'This form is not accepting submissions' }, 404)
  }

  const errors = validate(form.fields as Field[], answers as Answers)
  if (errors.length > 0) {
    return jsonResponse({ success: false, errors }, 422)
  }

  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({ form_id: form.id, answers })
    .select('id, submitted_at')
    .single()

  if (insertError) {
    console.error('submit-form: failed to insert submission', insertError)
    return jsonResponse({ success: false, error: 'Failed to store the submission' }, 500)
  }

  return jsonResponse({ success: true, submissionId: submission.id, submittedAt: submission.submitted_at }, 201)
})
