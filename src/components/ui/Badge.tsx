import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'muted'

type BadgeProps = {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 text-muted',
  success: 'border-esn-green/30 text-esn-green',
  muted: 'border-slate-200 text-slate-400',
}

export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium tracking-wide uppercase ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  )
}
