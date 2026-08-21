import { CenteredCardShell } from '../components/layout/CenteredCardShell'
import { PageHeader } from '../components/ui/PageHeader'
import { SecondaryButton } from '../components/ui/Button'
import { useAuth } from '../auth/useAuth'

// Placeholder — replaced with the real "my forms" list, creation flow, and
// AppShell nav in a later phase. This exists now so the login/signup flow
// has somewhere real to land and be tested end-to-end.
export function DashboardPage() {
  const { user, profile, signOut } = useAuth()

  return (
    <CenteredCardShell>
      <PageHeader title="Dashboard" subtitle={`Signed in as ${user?.email ?? 'unknown'} (${profile?.role ?? 'member'})`} />
      <SecondaryButton onClick={() => void signOut()}>Sign out</SecondaryButton>
    </CenteredCardShell>
  )
}
