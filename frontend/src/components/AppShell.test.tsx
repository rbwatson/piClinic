/**
 * AppShell.test.tsx
 *
 * Component tests for the AppShell sidebar navigation.
 * Verifies that nav items are shown or hidden based on the user's
 * accessGranted role.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

function renderShell(accessGranted: AuthUser['accessGranted']) {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: makeUser(accessGranted),
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  })
  return render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppShell navigation visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows Dashboard and Patients nav items for all roles', () => {
    renderShell('ClinicReadOnly')
    expect(screen.getByText('NAV_DASHBOARD')).toBeInTheDocument()
    expect(screen.getByText('NAV_PATIENTS')).toBeInTheDocument()
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
    expect(screen.getByText('NAV_ADMIN')).toBeInTheDocument()
  })

  it('shows Admin nav for SystemAdmin', () => {
    renderShell('SystemAdmin')
    expect(screen.getByText('NAV_ADMIN')).toBeInTheDocument()
  })

  it('shows the logged-in username in the sidebar', () => {
    renderShell('ClinicStaff')
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('shows the logout button', () => {
    renderShell('ClinicStaff')
    expect(screen.getByRole('button', { name: 'SESSION_LOGOUT' })).toBeInTheDocument()
  })
})
