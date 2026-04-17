/**
 * AuthContext.tsx
 *
 * Provides authentication state and actions to the entire app.
 * Session token is persisted to sessionStorage so it survives page reloads
 * within the same browser tab. sessionStorage is cleared when the tab closes,
 * which is appropriate for a shared clinic kiosk.
 *
 * On mount, if a stored token exists it is validated via GET /auth/session.
 * isLoading is true during this check so ProtectedRoute does not redirect
 * prematurely.
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated, isLoading } = useAuth()
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import api, { clearSessionToken, setSessionToken } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { getStoredToken, storeToken, clearStoredToken } from '@/lib/session'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccessLevel =
  | 'SystemAdmin'
  | 'ClinicAdmin'
  | 'ClinicStaff'
  | 'ClinicReadOnly'

export interface AuthUser {
  username: string
  accessGranted: AccessLevel
  preferredLanguage: 'en' | 'es' | 'ui'
  sessionClinicPublicID: string | null
  expiresOnDate: string
  token: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  // Start in loading state only if there is a stored token to validate.
  // Initialising from sessionStorage here (not in an effect) avoids the
  // "setState synchronously within an effect" lint error.
  const [state, setState] = useState<AuthState>({
    user:            null,
    isAuthenticated: false,
    isLoading:       !!getStoredToken(),
    error:           null,
  })

  // ---------------------------------------------------------------------------
  // Restore session from sessionStorage on mount
  // Only runs when there is a stored token (isLoading was set true above).
  // The API call is async so setState is called inside a .then()/.catch(),
  // not synchronously in the effect body.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) return

    api
      .get('/auth/session', { headers: { 'X-Session-Token': stored } })
      .then((res) => {
        const data = res.data?.data ?? res.data
        setSessionToken(stored)
        setState({
          user: {
            username:              data.username,
            accessGranted:         data.accessGranted,
            preferredLanguage:     data.sessionLanguage ?? 'en',
            sessionClinicPublicID: data.sessionClinicPublicID ?? null,
            expiresOnDate:         data.expiresOnDate,
            token:                 stored,
          },
          isAuthenticated: true,
          isLoading:       false,
          error:           null,
        })
      })
      .catch(() => {
        // Token expired or invalid — clear and let ProtectedRoute redirect
        clearStoredToken()
        clearSessionToken()
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Listen for 401 events from the Axios interceptor
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleUnauthorized() {
      clearSessionToken()
      clearStoredToken()
      queryClient.clear()
      setState({
        user:            null,
        isAuthenticated: false,
        isLoading:       false,
        error:           null,
      })
      navigate('/login', { replace: true })
    }

    window.addEventListener('piclinic:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('piclinic:unauthorized', handleUnauthorized)
    }
  }, [navigate])

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  const login = useCallback(
    async (username: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }))
      try {
        const response = await api.post('/auth/login', { username, password })
        const data = response.data?.data ?? response.data
        const token: string = data.token
        setSessionToken(token)
        storeToken(token)
        setState({
          user: {
            username:              data.username,
            accessGranted:         data.accessGranted,
            preferredLanguage:     data.sessionLanguage ?? 'en',
            sessionClinicPublicID: data.sessionClinicPublicID ?? null,
            expiresOnDate:         data.expiresOnDate,
            token,
          },
          isAuthenticated: true,
          isLoading:       false,
          error:           null,
        })
        navigate('/', { replace: true })
      } catch (err: unknown) {
        const status =
          (err as { response?: { status?: number } }).response?.status
        clearSessionToken()
        clearStoredToken()
        setState({
          user:            null,
          isAuthenticated: false,
          isLoading:       false,
          error:           status === 401 ? 'LOGIN_ERROR' : 'ERROR_SERVER',
        })
      }
    },
    [navigate]
  )

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {})
    clearSessionToken()
    clearStoredToken()
    queryClient.clear()
    setState({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,
    })
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
