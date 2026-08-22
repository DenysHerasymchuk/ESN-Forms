import type { ReactNode } from 'react'
import { BrandStrip } from '../BrandStrip'
import { Footer } from '../Footer'
import { SocialLinks } from '../SocialLinks'

const ESN_LOGO_URL = '/pictures/Logo_ESN.png'

type Props = {
  // Title/description belong above the bordered card, not inside it with
  // the inputs - otherwise the whole thing reads as one boxed "modal"
  // instead of a page with a real heading.
  heading?: ReactNode
  children?: ReactNode
  belowCard?: ReactNode
}

// The richer public-facing shell (logo flanking the card, socials on the
// other side) used by every form respondents actually fill out - the
// legacy ESN Card page and the dynamic public form page both share this,
// distinct from CenteredCardShell's plainer chrome for app pages
// (login, 404) that aren't "a form" in this branded sense.
export function BrandedFormShell({ heading, children, belowCard }: Props) {
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

          <div className="animate-rise mx-auto w-full max-w-2xl xl:col-start-2 xl:row-start-1">
            {heading}
            {children && (
              <div className="surface-card relative overflow-hidden">
                <div className="p-6 sm:p-10">{children}</div>
              </div>
            )}
            {belowCard}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
