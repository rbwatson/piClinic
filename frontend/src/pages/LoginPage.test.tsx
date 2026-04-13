/**
 * LoginPage.test.tsx
 *
 * Component tests for the LoginPage.
 * Verifies that the form renders correctly and shows validation errors
 * when submitted with empty fields.
 *
 * The AuthContext and react-router are mocked so these tests run
 * without a real backend or router context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import * as AuthContext from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockLogin = vi.fn()
const mockUseAuth = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: mockLogin,
  logout: vi.fn(),
}

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginPage', () => {
  beforeEach(() => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockUseAuth)
    mockLogin.mockReset()
  })

  it('renders the username and password fields', () => {
    renderLoginPage()
    expect(screen.getByLabelText('LOGIN_USERNAME')).toBeInTheDocument()
    expect(screen.getByLabelText('LOGIN_PASSWORD')).toBeInTheDocument()
  })

  it('renders the login submit button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'LOGIN_SUBMIT' })).toBeInTheDocument()
  })

  it('renders EN and ES language buttons', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'LANGUAGE_EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LANGUAGE_ES' })).toBeInTheDocument()
  })

  it('shows a required-field error when username is empty on submit', async () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN_SUBMIT' }))
    await waitFor(() => {
      // Two required-field errors: one for username, one for password
      const errors = screen.getAllByText('ERROR_REQUIRED_FIELD')
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('does not call login when form is submitted empty', async () => {
    renderLoginPage()
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN_SUBMIT' }))
    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  it('calls login with the entered credentials on submit', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('LOGIN_USERNAME'), {
      target: { value: 'TestSA' },
    })
    fireEvent.change(screen.getByLabelText('LOGIN_PASSWORD'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'LOGIN_SUBMIT' }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('TestSA', 'password123')
    })
  })

  it('shows an error banner when error state is set', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      ...mockUseAuth,
      error: 'LOGIN_ERROR',
    })
    renderLoginPage()
    expect(screen.getByText('LOGIN_ERROR')).toBeInTheDocument()
  })

  it('disables the submit button while loading', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      ...mockUseAuth,
      isLoading: true,
    })
    renderLoginPage()
    expect(screen.getByRole('button', { name: 'LOADING' })).toBeDisabled()
  })
})
