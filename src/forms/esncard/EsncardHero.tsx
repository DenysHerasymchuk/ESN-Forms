import { PageHeader } from '../../components/ui/PageHeader'

export function EsncardHero() {
  return (
    <PageHeader
      title="ESNcard Registration"
      badge={
        <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
          2025–2026
        </span>
      }
      subtitle="For international students on exchange in the Kempen. Fields marked with an asterisk are required."
    />
  )
}
