import { Link } from 'react-router-dom'
import { CenteredCardShell } from '../components/layout/CenteredCardShell'
import { PageHeader } from '../components/ui/PageHeader'
import { secondaryButtonClassName } from '../components/ui/buttonStyles'

export function NotFoundPage() {
  return (
    <CenteredCardShell>
      <PageHeader title="Page not found" subtitle="The page you're looking for doesn't exist or may have moved." />
      <Link to="/" className={secondaryButtonClassName('blue', 'mt-6')}>
        Go home
      </Link>
    </CenteredCardShell>
  )
}
