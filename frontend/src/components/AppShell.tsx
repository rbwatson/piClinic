/**
 * AppShell.tsx
 *
 * Persistent layout wrapper for all authenticated pages.
 *
 * Layout:
 *   Mobile (<md): top bar with hamburger, collapsible nav drawer
 *   Tablet/Desktop (>=md): fixed left sidebar, scrollable content area
 *
 * Sidebar contains:
 *   - App name
 *   - Patient quick-search (always visible — supports looking up a patient
 *     from any page without losing current context)
 *   - Nav links (role-filtered)
 *   - Language toggle + logout
 *
 * Quick-search submits to /patients?q=... matching the v1 inline search
 * that appeared on every authenticated page.
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  to: string
  labelKey: string
  minRole?: 'ClinicAdmin' | 'SystemAdmin'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',         labelKey: 'NAV_DASHBOARD' },
  { to: '/patients', labelKey: 'NAV_PATIENTS' },
  { to: '/reports',  labelKey: 'NAV_REPORTS' },
  { to: '/admin',    labelKey: 'NAV_ADMIN', minRole: 'ClinicAdmin' },
]

const ROLE_ORDER: Record<string, number> = {
  ClinicReadOnly: 0,
  ClinicStaff:    1,
  ClinicAdmin:    2,
  SystemAdmin:    3,
}

function hasRole(userRole: string, minRole: string): boolean {
  return (ROLE_ORDER[userRole] ?? 0) >= (ROLE_ORDER[minRole] ?? 0)
}

// ---------------------------------------------------------------------------
// Sidebar content (shared between desktop sidebar and mobile drawer)
// ---------------------------------------------------------------------------

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(user?.accessGranted ?? '', item.minRole)
  )

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
      onNavigate?.()
    }
  }

  return (
    <>
      {/* App name */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <span className="text-base font-bold italic text-white tracking-tight">
          {t('APP_NAME')}
        </span>
      </div>

      {/* Patient quick-search */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <form onSubmit={handleSearchSubmit} className="flex gap-1">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('PATIENT_SEARCH_ID_LABEL')}
            className="flex-1 min-w-0 rounded px-2 py-1 text-xs bg-white/10 text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:border-white/60"
          />
          <button
            type="submit"
            className="px-2 py-1 rounded text-xs bg-white/20 text-white hover:bg-white/30 transition-colors flex-shrink-0"
          >
            {t('ACTION_SEARCH')}
          </button>
        </form>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center px-3 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-white font-medium'
                  : 'text-white/90 hover:bg-white/15',
              ].join(' ')
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Session info + controls */}
      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-white/75 space-y-2">
        {user && (
          <p className="truncate">
            {t('SESSION_LOGGED_IN_AS')}{' '}
            <span className="font-medium text-white">{user.username}</span>
          </p>
        )}
        <div className="flex items-center justify-between">
          {/* Language toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`transition-colors ${
                i18n.language === 'en'
                  ? 'text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => i18n.changeLanguage('es')}
              className={`transition-colors ${
                i18n.language === 'es'
                  ? 'text-white font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ES
            </button>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            className="text-white/75 hover:text-white transition-colors"
          >
            {t('SESSION_LOGOUT')}
          </button>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex w-52 flex-shrink-0 bg-sidebar flex-col border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar (<md) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center bg-sidebar px-3 py-2 border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-1 mr-3"
          aria-label="Open menu"
        >
          {/* Hamburger */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-base font-bold italic text-white flex-1">piClinic</span>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-10 flex flex-col w-64 bg-sidebar h-full shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
              <span className="text-base font-bold italic text-white">piClinic</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/75 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Spacer for mobile top bar */}
        <div className="md:hidden h-11 flex-shrink-0" />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

    </div>
  )
}