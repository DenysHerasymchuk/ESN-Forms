import { Link } from 'react-router-dom'

type Props = {
  // Only true for the dashboard's footer - the public-facing pages (ESN
  // Card, published forms) don't show this since they already have their
  // own logo treatment flanking the card.
  showBrandMark?: boolean
}

export function Footer({ showBrandMark = false }: Props) {
  return (
    <footer className="bg-ink px-4 py-10 sm:px-6">
      <div className={`flex flex-wrap items-center gap-8 ${showBrandMark ? 'justify-between' : ''}`}>
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

        {showBrandMark && (
          <Link to="/dashboard" className="hidden items-center rounded-md lg:flex">
            <img src="/pictures/Logo_ESN.png" alt="ESN Forms" className="h-24 w-auto brightness-0 invert" />
          </Link>
        )}
      </div>
    </footer>
  )
}
