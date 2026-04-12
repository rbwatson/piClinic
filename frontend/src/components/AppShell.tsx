/**
 * AppShell.tsx
 *
 * Persistent layout wrapper for all authenticated pages.
 * Renders the sidebar navigation, header bar, and main content area.
 * Outlet renders the active page's content.
 *
 * Sidebar nav items are filtered by accessGranted role so clinic staff
 * don't see admin-only links.
 */

import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  to: string
  labelKey: string
  /** Minimum role required. Omit for all authenticated users. */
  minRole?: 'ClinicAdmin' | 'SystemAdmin'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',          labelKey: 'NAV_DASHBOARD' },
  { to: '/patients',  labelKey: 'NAV_PATIENTS' },
  { to: '/reports',   labelKey: 'NAV_REPORTS' },
  { to: '/admin',     labelKey: 'NAV_ADMIN', minRole: 'ClinicAdmin' },
]

const ROLE_ORDER: Record<string, number> = {
  ClinicReadOnly: 0,
  ClinicStaff: 1,
  ClinicAdmin: 2,
  SystemAdmin: 3,
}

function hasRole(userRole: string, minRole: string): boolean {
  return (ROLE_ORDER[userRole] ?? 0) >= (ROLE_ORDER[minRole] ?? 0)
}

export default function AppShell() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(user?.accessGranted ?? '', item.minRole)
  )

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">

        {/* App name / logo area */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <span className="text-base font-semibold text-white tracking-tight">
            {t('APP_NAME')}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-white/10',
                ].join(' ')
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Session info + logout */}
        <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/70 space-y-2">
          {user && (
            <p className="truncate">
              {t('SESSION_LOGGED_IN_AS')}{' '}
              <span className="font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </span>
            </p>
          )}
          <div className="flex items-center justify-between">
            {/* Language toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`transition-colors ${
                  i18n.language === 'en'
                    ? 'text-sidebar-accent font-medium'
                    : 'hover:text-sidebar-foreground'
                }`}
              >
                EN
              </button>
              <span>|</span>
              <button
                onClick={() => i18n.changeLanguage('es')}
                className={`transition-colors ${
                  i18n.language === 'es'
                    ? 'text-sidebar-accent font-medium'
                    : 'hover:text-sidebar-foreground'
                }`}
              >
                ES
              </button>
            </div>
            {/* Logout */}
            <button
              onClick={logout}
              className="hover:text-sidebar-foreground transition-colors"
            >
              {t('SESSION_LOGOUT')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
