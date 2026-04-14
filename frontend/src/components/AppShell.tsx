/**
 * AppShell.tsx
 *
 * Persistent layout wrapper for all authenticated pages.
 *
 * Layout:
 *   Desktop (>=768px): fixed-width left sidebar + scrollable content area
 *   Mobile  (<768px):  collapsible top bar + drawer
 *
 * Uses inline styles throughout to avoid Tailwind v4 responsive-prefix
 * resolution issues. Responsive breakpoint is handled via CSS media queries
 * in globals.css (.hidden-mobile, .mobile-topbar, .mobile-spacer).
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

// Sidebar colours — use literal HSL values so they are independent of
// Tailwind utility resolution
const SIDEBAR_BG     = 'hsl(213, 60%, 58%)'
const SIDEBAR_BORDER = 'hsl(213, 60%, 45%)'
const SIDEBAR_HOVER  = 'hsl(213, 60%, 45%)'

// ---------------------------------------------------------------------------
// Sidebar content
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* App name */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0 }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>
          {t('APP_NAME')}
        </span>
      </div>

      {/* Patient quick-search */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '4px' }}>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('PATIENT_SEARCH_ID_LABEL')}
            style={{
              flex: 1, minWidth: 0, borderRadius: '4px',
              padding: '4px 8px', fontSize: '12px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
              background: 'rgba(255,255,255,0.25)', color: '#fff',
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {t('ACTION_SEARCH')}
          </button>
        </form>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '2px',
              background: isActive ? SIDEBAR_HOVER : 'transparent',
              color: '#fff',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Session info + controls */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${SIDEBAR_BORDER}`,
        fontSize: '12px',
        color: 'rgba(255,255,255,0.75)',
        flexShrink: 0,
      }}>
        {user && (
          <p style={{ margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('SESSION_LOGGED_IN_AS')}{' '}
            <span style={{ fontWeight: 600, color: '#fff' }}>{user.username}</span>
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['en', 'es'] as const).map((lang, i) => (
              <span key={lang} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>}
                <button
                  onClick={() => i18n.changeLanguage(lang)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: '12px',
                    color: i18n.language === lang ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: i18n.language === lang ? 600 : 400,
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: '12px', color: 'rgba(255,255,255,0.75)',
            }}
          >
            {t('SESSION_LOGOUT')}
          </button>
        </div>
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    // Outer flex row: sidebar + content side by side
    // flex: 1 so it fills the #root flex column
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ── Desktop sidebar — hidden below 768px via .hidden-mobile CSS class ── */}
      <aside
        className="hidden-mobile"
        style={{
          width: '208px',
          flexShrink: 0,
          background: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar — hidden above 768px via .mobile-topbar CSS class ── */}
      <div
        className="mobile-topbar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', alignItems: 'center',
          background: SIDEBAR_BG,
          padding: '8px 12px',
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px', marginRight: '12px' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span style={{ fontSize: '1rem', fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>piClinic</span>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: 'relative', zIndex: 10,
            width: '256px', height: '100%',
            background: SIDEBAR_BG,
            boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: `1px solid ${SIDEBAR_BORDER}`,
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>piClinic</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Spacer for mobile top bar — hidden above 768px via .mobile-spacer CSS class */}
        <div className="mobile-spacer" style={{ height: '44px', flexShrink: 0 }} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

    </div>
  )
}
