import { Link } from 'react-router-dom'
import { CenteredCardShell } from '../components/layout/CenteredCardShell'

export function NotFoundPage() {
  return (
    <CenteredCardShell>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist or may have moved.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-esn-blue transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue"
      >
        Go home
      </Link>
    </CenteredCardShell>
  )
}
