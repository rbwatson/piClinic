/**
 * AppShell.tsx
 *
 * Persistent layout wrapper for all authenticated pages.
 *
 * Layout:
 *   Desktop (>=768px): fixed horizontal top-bar with three stacked bars
 *                      (banner 70px + session ~30px + nav ~30px = ~130px)
 *                      followed by full-width scrollable content area.
 *   Mobile  (<768px):  slim fixed bar (app name + hamburger) + drawer.
 *
 * All layout, sizing, position, and responsive behavior is in AppShell.css.
 * No Tailwind layout classes in this file.
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import './AppShell.css'

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
// Patient quick-search form (used in banner bar and mobile drawer)
// ---------------------------------------------------------------------------

function PatientSearch({ onSubmit }: { onSubmit?: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
      onSubmit?.()
    }
  }

  return (
    <form className="shell-search-form" onSubmit={handleSubmit}>
      <input
        type="search"
        className="shell-search-input"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={t('PATIENT_SEARCH_ID_LABEL')}
        aria-label={t('PATIENT_SEARCH_ID_LABEL')}
      />
      <button type="submit" className="shell-search-btn">
        {t('ACTION_SEARCH')}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Nav link list (used in nav bar and mobile drawer)
// ---------------------------------------------------------------------------

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(user?.accessGranted ?? '', item.minRole)
  )

  return (
    <ul className="top-link-menu-list">
      {visibleNavItems.map((item) => (
        <li key={item.to} className="top-link-menu-item">
          <NavLink
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
          >
            {({ isActive }) =>
              isActive
                ? <span className="top-link-current">{t(item.labelKey)}</span>
                : t(item.labelKey)
            }
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Mobile drawer content
// ---------------------------------------------------------------------------

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="shell-drawer-inner">
      <div className="shell-drawer-header">
        <span className="shell-app-name">{t('APP_NAME')}</span>
        <button
          className="shell-drawer-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="shell-drawer-search">
        <PatientSearch onSubmit={onClose} />
      </div>

      <nav className="shell-drawer-nav">
        <NavLinks onNavigate={onClose} />
      </nav>

      <div className="shell-drawer-session">
        {user && (
          <p className="shell-drawer-username">
            {t('SESSION_LOGGED_IN_AS')}{' '}
            <strong>{user.username}</strong>
          </p>
        )}
        <div className="shell-drawer-session-controls">
          <div className="shell-lang-links">
            {(['en', 'es'] as const).map((lang, i) => (
              <span key={lang} className="shell-lang-item">
                {i > 0 && <span className="shell-lang-sep">|</span>}
                <button
                  className={`shell-lang-btn${i18n.language === lang ? ' shell-lang-btn--active' : ''}`}
                  onClick={() => i18n.changeLanguage(lang)}
                >
                  {lang === 'en' ? 'English' : 'Español'}
                </button>
              </span>
            ))}
          </div>
          <button className="shell-logout-btn" onClick={logout}>
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
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div id="app-shell">

      {/* ── Fixed header ── */}
      <header id="shell-header">

        {/* Desktop three-bar header — hidden below 768px */}
        <div className="shell-header-full">

          {/* Bar 1: Banner */}
          <div className="shell-bar-banner">
            <span className="shell-app-name">{t('APP_NAME')}</span>
            <PatientSearch />
          </div>

          {/* Bar 2: Session */}
          <div className="shell-bar-session">
            <div className="shell-session-left">
              {user && (
                <>
                  {t('SESSION_LOGGED_IN_AS')}{' '}
                  <span className="shell-session-username">{user.username}</span>
                  <span className="shell-session-sep"> | </span>
                  <a href="/settings">{t('SESSION_SETTINGS')}</a>
                  <span className="shell-session-sep"> | </span>
                  <button className="shell-session-btn" onClick={logout}>
                    {t('SESSION_LOGOUT')}
                  </button>
                </>
              )}
            </div>
            <div className="shell-session-right">
              {(['en', 'es'] as const).map((lang, i) => (
                <span key={lang} className="shell-lang-item">
                  {i > 0 && <span className="shell-lang-sep"> | </span>}
                  {i18n.language === lang
                    ? <span className="shell-lang-current">
                        {lang === 'en' ? 'English' : 'Español'}
                      </span>
                    : <button
                        className="shell-session-btn"
                        onClick={() => i18n.changeLanguage(lang)}
                      >
                        {lang === 'en' ? 'English' : 'Español'}
                      </button>
                  }
                </span>
              ))}
            </div>
          </div>

          {/* Bar 3: Nav */}
          <div className="shell-bar-nav">
            <nav className="shell-nav-left">
              <NavLinks />
            </nav>
            <div className="shell-nav-right">
              {/* Secondary link slot — placeholder for future use */}
            </div>
          </div>

        </div>

        {/* Mobile slim bar — hidden above 768px */}
        <div className="shell-header-mobile">
          <button
            className="shell-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="shell-app-name">{t('APP_NAME')}</span>
        </div>

      </header>

      {/* ── Header spacer — pushes content below fixed header ── */}
      <div id="shell-spacer" aria-hidden="true" />

      {/* ── Page content ── */}
      <main id="shell-content">
        <Outlet />
      </main>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          id="shell-drawer-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        >
          <aside
            id="shell-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Navigation menu"
          >
            <DrawerContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

    </div>
  )
}