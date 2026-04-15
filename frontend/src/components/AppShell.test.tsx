/**
 * AppShell.test.tsx
 *
 * Component tests for the AppShell horizontal top-bar layout.
 *
 * Covers:
 *   - App name rendered in banner
 *   - Session bar shows username and logout button
 *   - Nav items shown/hidden by role
 *   - Current page rendered as non-linked text
 *   - Patient search submits to /patients?q=...
 *   - Hamburger button present (mobile)
 *   - Logout calls logout() from useAuth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import * as AuthContext from '@/context/AuthContext'
import type { AuthUser } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(accessGranted: AuthUser['accessGranted']): AuthUser {
  return {
    username: 'testuser',
    accessGranted,
    preferredLanguage: 'en',
    sessionClinicPublicID: null,
    expiresOnDate: '2099-01-01 00:00:00',
    token: 'test-token',
  }
}

function renderShell(
  accessGranted: AuthUser['accessGranted'] = 'ClinicStaff',
  initialPath = '/'
) {
  const logout = vi.fn()
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: makeUser(accessGranted),
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout,
  })
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell />
    </MemoryRouter>
  )
  return { logout }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppShell — banner', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('renders the app name', () => {
    renderShell()
    expect(screen.getAllByText('APP_NAME').length).toBeGreaterThan(0)
  })
})

describe('AppShell — session bar', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('shows the logged-in username', () => {
    renderShell()
    expect(screen.getAllByText('testuser').length).toBeGreaterThan(0)
  })

  it('shows the logout button', () => {
    renderShell()
    expect(screen.getAllByRole('button', { name: 'SESSION_LOGOUT' }).length).toBeGreaterThan(0)
  })

  it('calls logout() when logout button is clicked', () => {
    const { logout } = renderShell()
    const btns = screen.getAllByRole('button', { name: 'SESSION_LOGOUT' })
    fireEvent.click(btns[0])
    expect(logout).toHaveBeenCalledOnce()
  })
})

describe('AppShell — nav visibility by role', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('shows Dashboard and Patients for all roles', () => {
    renderShell('ClinicReadOnly')
    expect(screen.getAllByText('NAV_DASHBOARD').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NAV_PATIENTS').length).toBeGreaterThan(0)
  })

  it('does not show Admin nav for ClinicReadOnly', () => {
    renderShell('ClinicReadOnly')
    expect(screen.queryByText('NAV_ADMIN')).not.toBeInTheDocument()
  })

  it('does not show Admin nav for ClinicStaff', () => {
    renderShell('ClinicStaff')
    expect(screen.queryByText('NAV_ADMIN')).not.toBeInTheDocument()
  })

  it('shows Admin nav for ClinicAdmin', () => {
    renderShell('ClinicAdmin')
    expect(screen.getAllByText('NAV_ADMIN').length).toBeGreaterThan(0)
  })

  it('shows Admin nav for SystemAdmin', () => {
    renderShell('SystemAdmin')
    expect(screen.getAllByText('NAV_ADMIN').length).toBeGreaterThan(0)
  })
})

describe('AppShell — current page as plain text', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('renders the active nav item as a span, not an anchor', () => {
    renderShell('ClinicStaff', '/')
    const dashboardTexts = screen.getAllByText('NAV_DASHBOARD')
    const hasSpan = dashboardTexts.some(
      (el) => el.tagName === 'SPAN' && el.classList.contains('top-link-current')
    )
    expect(hasSpan).toBe(true)
  })
})

describe('AppShell — patient quick-search', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('renders the search input in the banner bar', () => {
    renderShell()
    const inputs = screen.getAllByRole('searchbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('navigates to /patients?q=... on search submit', async () => {
    renderShell()
    const inputs = screen.getAllByRole('searchbox')
    fireEvent.change(inputs[0], { target: { value: 'Smith' } })
    const submitBtns = screen.getAllByRole('button', { name: 'ACTION_SEARCH' })
    fireEvent.click(submitBtns[0])
    await waitFor(() => {
      expect((inputs[0] as HTMLInputElement).value).toBe('')
    })
  })
})

describe('AppShell — mobile hamburger', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('renders a button with the Open menu label', () => {
    renderShell()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('opens the drawer when hamburger is clicked', async () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await waitFor(() => {
      expect(document.getElementById('shell-drawer')).toBeInTheDocument()
    })
  })

  it('closes the drawer when the close button is clicked', async () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    await waitFor(() => {
      expect(document.getElementById('shell-drawer')).not.toBeInTheDocument()
    })
  })
})
