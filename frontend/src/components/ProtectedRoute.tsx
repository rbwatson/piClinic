/**
 * ProtectedRoute.tsx
 *
 * Wraps routes that require authentication. Redirects unauthenticated
 * users to /login, preserving the attempted path in location state so
 * LoginPage can redirect back after a successful login.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
