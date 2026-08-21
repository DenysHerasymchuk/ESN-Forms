// Hand-written to match the migrations under supabase/migrations. Once a
// real Supabase project exists, `supabase gen types typescript` can
// regenerate this file from the live schema instead.
import type { Field } from './formField'

export type FormStatus = 'draft' | 'published' | 'archived'

export type FormRow = {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  status: FormStatus
  fields: Field[]
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
}

export type SubmissionRow = {
  id: string
  form_id: string
  answers: Record<string, string | string[]>
  submitted_at: string
}

export type IntegrationProvider = 'google_sheets' | 'webhook' | 'email' | 'discord'

export type IntegrationRow = {
  id: string
  form_id: string
  provider: IntegrationProvider
  enabled: boolean
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type IntegrationDeliveryRow = {
  id: string
  submission_id: string
  integration_id: string
  status: 'pending' | 'success' | 'failed'
  attempt_count: number
  last_attempted_at: string | null
  last_error: string | null
  created_at: string
}

export type UserRole = 'member' | 'admin'

export type ProfileRow = {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      forms: {
        Row: FormRow
        Insert: Partial<FormRow> & Pick<FormRow, 'owner_id' | 'name' | 'slug'>
        Update: Partial<FormRow>
        Relationships: []
      }
      submissions: {
        Row: SubmissionRow
        Insert: Partial<SubmissionRow> & Pick<SubmissionRow, 'form_id'>
        Update: Partial<SubmissionRow>
        Relationships: []
      }
      integrations: {
        Row: IntegrationRow
        Insert: Partial<IntegrationRow> & Pick<IntegrationRow, 'form_id' | 'provider'>
        Update: Partial<IntegrationRow>
        Relationships: []
      }
      integration_deliveries: {
        Row: IntegrationDeliveryRow
        Insert: Partial<IntegrationDeliveryRow> & Pick<IntegrationDeliveryRow, 'submission_id' | 'integration_id'>
        Update: Partial<IntegrationDeliveryRow>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'email'>
        Update: Partial<ProfileRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_form: {
        Args: { p_name: string; p_description: string | null; p_fields: Field[] }
        Returns: FormRow
      }
    }
  }
}
