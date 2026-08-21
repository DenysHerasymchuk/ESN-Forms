// Invoked asynchronously after a submission is stored (see the
// submissions_dispatch_integrations trigger). Runs unaware of the fact that
// a submission was ever inserted "for" any particular reason - it just fans
// out to whatever integrations are enabled for the form, isolating each
// provider's failure from the others and from the submission itself, which
// has already committed by the time this runs.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import { corsHeaders } from '../_shared/cors.ts'

type Submission = {
  id: string
  form_id: string
  answers: Record<string, unknown>
  submitted_at: string
}

type FormField = {
  id: string
  label: string
}

type IntegrationHandlerArgs = {
  submission: Submission
  fields: FormField[]
  config: Record<string, unknown>
}

type IntegrationHandler = (args: IntegrationHandlerArgs) => Promise<void>

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null) return ''
  return Array.isArray(value) ? value.join(', ') : String(value)
}

const handlers: Record<string, IntegrationHandler> = {
  webhook: async ({ submission, config }) => {
    const url = config.url
    if (typeof url !== 'string' || !url) throw new Error('webhook integration is missing "url" in its config')

    const extraHeaders = (config.headers as Record<string, string> | undefined) ?? {}
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({
        submissionId: submission.id,
        submittedAt: submission.submitted_at,
        answers: submission.answers,
      }),
    })
    if (!response.ok) throw new Error(`webhook responded with status ${response.status}`)
  },

  discord: async ({ submission, fields, config }) => {
    const webhookUrl = config.webhookUrl
    if (typeof webhookUrl !== 'string' || !webhookUrl) {
      throw new Error('discord integration is missing "webhookUrl" in its config')
    }

    const lines = fields.map((field) => `**${field.label}**: ${formatAnswer(submission.answers[field.id])}`)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: lines.join('\n').slice(0, 1900) }),
    })
    if (!response.ok) throw new Error(`discord webhook responded with status ${response.status}`)
  },

  email: async () => {
    throw new Error('email integration is not implemented yet')
  },

  google_sheets: async () => {
    throw new Error('google_sheets integration is not implemented yet')
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload: { submission_id?: unknown }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const submissionId = payload.submission_id
  if (typeof submissionId !== 'string' || !submissionId) {
    return new Response(JSON.stringify({ error: 'submission_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('id, form_id, answers, submitted_at')
    .eq('id', submissionId)
    .single()

  if (submissionError || !submission) {
    return new Response(JSON.stringify({ error: 'Submission not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: form } = await supabase.from('forms').select('fields').eq('id', submission.form_id).single()
  const fields = ((form?.fields ?? []) as FormField[]).map(({ id, label }) => ({ id, label }))

  const { data: integrations, error: integrationsError } = await supabase
    .from('integrations')
    .select('id, provider, config')
    .eq('form_id', submission.form_id)
    .eq('enabled', true)

  if (integrationsError) {
    return new Response(JSON.stringify({ error: 'Failed to load integrations' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results = await Promise.all(
    (integrations ?? []).map(async (integration) => {
      const { data: delivery } = await supabase
        .from('integration_deliveries')
        .insert({ submission_id: submission.id, integration_id: integration.id, status: 'pending' })
        .select('id')
        .single()

      const handler = handlers[integration.provider]

      try {
        if (!handler) throw new Error(`Unknown integration provider "${integration.provider}"`)
        await handler({ submission, fields, config: (integration.config as Record<string, unknown>) ?? {} })

        if (delivery) {
          await supabase
            .from('integration_deliveries')
            .update({ status: 'success', attempt_count: 1, last_attempted_at: new Date().toISOString() })
            .eq('id', delivery.id)
        }
        return { provider: integration.provider, status: 'success' as const }
      } catch (error) {
        if (delivery) {
          await supabase
            .from('integration_deliveries')
            .update({
              status: 'failed',
              attempt_count: 1,
              last_attempted_at: new Date().toISOString(),
              last_error: error instanceof Error ? error.message : String(error),
            })
            .eq('id', delivery.id)
        }
        return { provider: integration.provider, status: 'failed' as const }
      }
    }),
  )

  return new Response(JSON.stringify({ dispatched: results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
