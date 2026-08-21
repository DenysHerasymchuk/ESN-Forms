import { BrandStrip } from '../../components/BrandStrip'
import { Footer } from '../../components/Footer'
import { SocialLinks } from '../../components/SocialLinks'
import { EsncardForm } from '../../forms/esncard/EsncardForm'
import { EsncardHero } from '../../forms/esncard/EsncardHero'

const ESN_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_ESN_AISBL.png'

export function EsncardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <BrandStrip />

      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[1fr_42rem_1fr] xl:items-start">
          {/* Small screens: logo + socials together, above the card */}
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 xl:hidden">
            <img src={ESN_LOGO_URL} alt="ESN Geel" className="h-24 w-auto" />
            <SocialLinks />
          </div>

          {/* Large screens: logo flanks the card in the left gutter */}
          <div className="hidden xl:col-start-1 xl:row-start-1 xl:flex xl:justify-start xl:pt-8">
            <img src={ESN_LOGO_URL} alt="ESN Geel" className="h-32 w-auto" />
          </div>

          {/* Large screens: socials flank the card in the right gutter */}
          <div className="hidden xl:col-start-3 xl:row-start-1 xl:flex xl:justify-end xl:pt-8">
            <SocialLinks />
          </div>

          <div className="mx-auto w-full max-w-2xl xl:col-start-2 xl:row-start-1">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 sm:p-10">
                <EsncardHero />
                <EsncardForm />
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
                Development mode — submissions are not sent to Google Forms.
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
