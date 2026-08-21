import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'muted'

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 text-muted',
  success: 'border-esn-green/30 text-esn-green',
  muted: 'border-slate-200 text-slate-400',
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
