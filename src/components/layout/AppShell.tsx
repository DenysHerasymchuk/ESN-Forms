import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBoxArchive,
  FaTableList,
  FaClipboardList,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6'
import { useAuth } from '../../auth/useAuth'
import { SecondaryButton } from '../ui/Button'
import { BrandStrip } from '../BrandStrip'
import { Footer } from '../Footer'

type Props = {
  children: ReactNode
}

const navLinkBase =
  'inline-flex items-center gap-2.5 rounded-md border px-4 py-3 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `${navLinkBase} ${
    isActive ? 'border-esn-blue/30 bg-esn-blue/5 text-esn-blue' : 'border-slate-200 text-esn-blue hover:bg-slate-50'
  }`
}

export function AppShell({ children }: Props) {
  const { user, profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [isNavOpen, setIsNavOpen] = useState(false)

  const navLinks = (
    <>
      <NavLink to="/dashboard" end className={navLinkClassName} onClick={() => setIsNavOpen(false)}>
        <FaTableList aria-hidden="true" />
        My forms
      </NavLink>
      <NavLink to="/dashboard/archive" className={navLinkClassName} onClick={() => setIsNavOpen(false)}>
        <FaBoxArchive aria-hidden="true" />
        Archive
      </NavLink>
      {isAdmin && (
        <>
          <NavLink to="/dashboard/admin/users" className={navLinkClassName} onClick={() => setIsNavOpen(false)}>
            <FaUsers aria-hidden="true" />
            Users
          </NavLink>
          <NavLink to="/dashboard/admin/forms" className={navLinkClassName} onClick={() => setIsNavOpen(false)}>
            <FaClipboardList aria-hidden="true" />
            All forms
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <BrandStrip />
      <header className="border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
          {/* lg and up: full inline nav. Below lg: a dropdown menu instead. */}
          <nav className="hidden flex-wrap items-center gap-2 lg:flex">{navLinks}</nav>

          <div className="relative lg:hidden">
            <SecondaryButton
              onClick={() => setIsNavOpen((open) => !open)}
              aria-expanded={isNavOpen}
              aria-haspopup="true"
            >
              {isNavOpen ? <FaXmark aria-hidden="true" /> : <FaBars aria-hidden="true" />}
              Menu
            </SecondaryButton>

            {isNavOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setIsNavOpen(false)}
                />
                <nav className="absolute top-full left-0 z-20 mt-2 flex w-64 flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  {navLinks}
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <SecondaryButton onClick={() => void signOut()}>
              <FaArrowRightFromBracket aria-hidden="true" />
              Sign out
            </SecondaryButton>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</div>

      <Footer showBrandMark />
    </div>
  )
}
