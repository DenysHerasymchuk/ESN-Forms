import { Link } from 'react-router-dom'
import { SocialLinks } from './SocialLinks'

type Props = {
  // Only true for the dashboard's footer.
  showBrandMark?: boolean
  // Only true for the public-facing form shell - the dashboard doesn't
  // need social links in its footer.
  showSocials?: boolean
}

export function Footer({ showBrandMark = false, showSocials = false }: Props) {
  return (
    <footer className="bg-ink px-4 py-10 sm:px-6">
      <div className={`flex flex-wrap items-center gap-8 ${showBrandMark || showSocials ? 'justify-between' : ''}`}>
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            <img src="/favicon.ico" alt="" className="h-4 w-4 brightness-0 invert" aria-hidden="true" />
            About us
          </span>

          <p className="text-sm leading-relaxed text-white/65">
            Erasmus Student Network (ESN) is a non-profit international student organisation. Our
            mission is to represent international students, thus provide opportunities for cultural
            understanding and self-development under the principle of students helping students.
          </p>
        </div>

        {(showBrandMark || showSocials) && (
          <div className="flex w-full items-center justify-between gap-6 lg:w-auto lg:justify-start">
            {showBrandMark && (
              <Link to="/dashboard" className="flex items-center rounded-md">
                <img src="/pictures/Logo_ESN.png" alt="ESN Forms" className="h-16 w-auto brightness-0 invert sm:h-24" />
              </Link>
            )}
            {showSocials && <SocialLinks />}
          </div>
        )}
      </div>
    </footer>
  )
}
