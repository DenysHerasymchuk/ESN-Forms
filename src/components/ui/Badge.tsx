import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'muted' | 'admin'

type BadgeProps = {
  tone?: BadgeTone
  icon?: ReactNode
  size?: 'sm' | 'md'
  children: ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-muted',
  success: 'border-esn-green/20 bg-esn-green/8 text-esn-green',
  muted: 'border-slate-200 bg-slate-50 text-slate-400',
  // Marks admin-only surfaces/roles - kept to orange specifically so it
  // never gets confused with a status tone (success/neutral/muted).
  admin: 'border-esn-orange/20 bg-esn-orange/8 text-esn-orange',
}

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  md: 'gap-1.5 px-3.5 py-1.5 text-sm',
  sm: 'gap-1 px-2.5 py-1 text-xs',
}

export function Badge({ tone = 'neutral', icon, size = 'md', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-wide uppercase ${sizeClasses[size]} ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  )
}
