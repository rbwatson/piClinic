/**
 * AuthContext.tsx
 *
 * Provides authentication state and actions to the entire app.
 * Session token is held in memory only (no localStorage) — appropriate
 * for a shared clinic kiosk where the browser may be left unattended.
 *
 * The context listens for the 'piclinic:unauthorized' custom event fired
 * by the Axios interceptor in lib/api.ts and logs the user out automatically
 * on any 401 response.
 *
 * Session API response shape (POST /api/v2/auth/login):
 *   { status: 'success', data: {
 *       token, username, accessGranted,
 *       sessionLanguage, sessionClinicPublicID, expiresOnDate
 *   }}
 *
 * Note: the Session model does NOT include firstName/lastName.
 * The sidebar shows username only. A future enhancement can fetch
 * full name from GET /api/v2/staff/{username} after login if needed.
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated } = useAuth()
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

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })

  // Listen for 401 events from the Axios interceptor
  useEffect(() => {
    function handleUnauthorized() {
      clearSessionToken()
      queryClient.clear()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
      navigate('/login', { replace: true })
    }

    window.addEventListener('piclinic:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('piclinic:unauthorized', handleUnauthorized)
    }
  }, [navigate])

  const login = useCallback(
    async (username: string, password: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }))
      try {
        const response = await api.post('/auth/login', { username, password })
        // Login returns { status: 'success', data: Session }
        const data = response.data?.data ?? response.data
        const token: string = data.token
        setSessionToken(token)
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
          isLoading: false,
          error: null,
        })
        navigate('/', { replace: true })
      } catch (err: unknown) {
        const status =
          (err as { response?: { status?: number } }).response?.status
        clearSessionToken()
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: status === 401 ? 'LOGIN_ERROR' : 'ERROR_SERVER',
        })
      }
    },
    [navigate]
  )

  const logout = useCallback(() => {
    // Fire-and-forget — don't block the UI on the server response
    api.post('/auth/logout').catch(() => {})
    clearSessionToken()
    queryClient.clear()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
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
