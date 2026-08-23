import type { ReactNode } from 'react'
import { BrandStrip } from '../BrandStrip'
import { Footer } from '../Footer'

type Props = {
  // Title/description belong above the bordered card, not inside it with
  // the inputs - otherwise the whole thing reads as one boxed "modal"
  // instead of a page with a real heading.
  heading?: ReactNode
  children?: ReactNode
  belowCard?: ReactNode
}

// The richer public-facing shell used by every form respondents actually
// fill out, distinct from CenteredCardShell's plainer chrome for app pages
// (login, 404) that aren't "a form" in this branded sense. Logo and socials
// live in the footer (matching the dashboard's own footer placement)
// rather than flanking the card.
export function BrandedFormShell({ heading, children, belowCard }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <BrandStrip />

      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <div className="animate-rise mx-auto w-full max-w-2xl">
          {heading}
          {children && (
            <div className="surface-card relative overflow-hidden">
              <div className="p-6 sm:p-10">{children}</div>
            </div>
          )}
          {belowCard}
        </div>
      </div>

      <Footer showBrandMark showSocials />
    </div>
  )
}
