export type StatusTone = 'idle' | 'success' | 'error'

type StatusMessageProps = {
  tone: StatusTone
  message: string
}

const toneClasses: Record<StatusTone, string> = {
  idle: 'text-muted',
  success: 'text-success',
  error: 'text-error',
}

export function StatusMessage({ tone, message }: StatusMessageProps) {
  if (!message) return null
  return (
    <p role="status" aria-live="polite" className={`text-sm ${toneClasses[tone]}`}>
      {message}
    </p>
  )
}
