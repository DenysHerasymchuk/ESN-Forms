import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  badge?: ReactNode
  // Plain strings still render fine here - a div is used instead of a p
  // specifically so markdown output (lists, multiple paragraphs) can be
  // passed in too without producing invalid nested block markup.
  subtitle?: ReactNode
}

export function PageHeader({ title, badge, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {badge}
      </div>
      {subtitle && <div className="mt-3 text-sm text-muted">{subtitle}</div>}
    </div>
  )
}
