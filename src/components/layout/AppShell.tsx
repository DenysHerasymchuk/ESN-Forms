import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { SecondaryButton } from '../ui/Button'

type Props = {
  children: ReactNode
}

const navLinkBase =
  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `${navLinkBase} ${
    isActive ? 'border-esn-blue/30 bg-esn-blue/5 text-esn-blue' : 'border-slate-200 text-esn-blue hover:bg-slate-50'
  }`
}

export function AppShell({ children }: Props) {
  const { user, profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold tracking-tight text-ink">ESN Forms</span>
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/dashboard" end className={navLinkClassName}>
                My forms
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/dashboard/admin/users" className={navLinkClassName}>
                    Users
                  </NavLink>
                  <NavLink to="/dashboard/admin/forms" className={navLinkClassName}>
                    All forms
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <SecondaryButton onClick={() => void signOut()}>Sign out</SecondaryButton>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  )
}
