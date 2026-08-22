import { BrandedFormShell } from '../../components/layout/BrandedFormShell'
import { EsncardForm } from '../../forms/esncard/EsncardForm'
import { EsncardHero } from '../../forms/esncard/EsncardHero'

export function EsncardPage() {
  return (
    <BrandedFormShell
      heading={<EsncardHero />}
      belowCard={
        import.meta.env.DEV && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
            Development mode — submissions are not sent to Google Forms.
          </div>
        )
      }
    >
      <EsncardForm />
    </BrandedFormShell>
  )
}
