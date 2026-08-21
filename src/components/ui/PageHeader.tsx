import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  badge?: ReactNode
  subtitle?: string
}

export function PageHeader({ title, badge, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
    </div>
  )
}
