// Supabase/PostgREST errors are plain objects with a "message" property,
// not real Error instances - `error instanceof Error` misses them. This
// checks for a usable message on either shape before falling back.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return fallback
}
