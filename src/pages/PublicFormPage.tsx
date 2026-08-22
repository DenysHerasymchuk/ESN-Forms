import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { BrandedFormShell } from '../components/layout/BrandedFormShell'
import { PageHeader } from '../components/ui/PageHeader'
import { Markdown } from '../components/ui/Markdown'
import { DynamicForm, type SubmitResult } from '../components/forms/DynamicForm'
import { getPublishedFormBySlug } from '../lib/formsApi'
import { supabase } from '../lib/supabaseClient'
import type { Answers, ValidationError } from '../lib/formField'
import type { FormRow } from '../lib/database.types'

type LoadState = 'loading' | 'not-found' | 'found'

export function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const [form, setForm] = useState<FormRow | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    let isMounted = true

    if (!slug) {
      setLoadState('not-found')
      return
    }

    getPublishedFormBySlug(slug)
      .then((result) => {
        if (!isMounted) return
        if (result) {
          setForm(result)
          setLoadState('found')
        } else {
          setLoadState('not-found')
        }
      })
      .catch(() => {
        if (isMounted) setLoadState('not-found')
      })

    return () => {
      isMounted = false
    }
  }, [slug])

  async function handleSubmit(answers: Answers, turnstileToken: string): Promise<SubmitResult> {
    const { error } = await supabase.functions.invoke('submit-form', { body: { slug, answers, turnstileToken } })

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as { error?: string; errors?: ValidationError[] }
          return { success: false, error: body.error, errors: body.errors }
        } catch {
          return { success: false, error: 'Something went wrong. Please try again.' }
        }
      }
      return { success: false, error: 'Something went wrong. Please try again.' }
    }

    return { success: true }
  }

  if (loadState === 'loading') {
    return (
      <BrandedFormShell>
        <p role="status" aria-live="polite" className="text-sm text-muted">
          Loading…
        </p>
      </BrandedFormShell>
    )
  }

  if (loadState === 'not-found' || !form) {
    return (
      <BrandedFormShell
        heading={
          <PageHeader
            title="This form isn't available"
            subtitle="It may have been unpublished, or the link may be incorrect."
          />
        }
      />
    )
  }

  return (
    <BrandedFormShell
      heading={
        <PageHeader title={form.name} subtitle={form.description ? <Markdown>{form.description}</Markdown> : undefined} />
      }
    >
      <DynamicForm formId={form.id} fields={form.fields} onSubmit={handleSubmit} />
    </BrandedFormShell>
  )
}
