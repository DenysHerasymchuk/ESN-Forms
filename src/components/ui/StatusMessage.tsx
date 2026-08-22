import { FaCircleCheck, FaCircleExclamation } from 'react-icons/fa6'

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
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm ${toneClasses[tone]}`}>
      {tone === 'success' && <FaCircleCheck aria-hidden="true" />}
      {tone === 'error' && <FaCircleExclamation aria-hidden="true" />}
      {message}
    </p>
  )
}
