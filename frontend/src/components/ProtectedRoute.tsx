/**
 * ProtectedRoute.tsx
 *
 * Wraps routes that require authentication. Redirects unauthenticated
 * users to /login, preserving the attempted path in location state so
 * LoginPage can redirect back after a successful login.
 *
 * Returns null while isLoading is true (session restore in progress)
 * to avoid a premature redirect before the stored token is validated.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Wait for session restore before deciding
  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
