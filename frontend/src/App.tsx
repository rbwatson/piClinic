/**
 * App.tsx
 * Root router configuration.
 *
 * Route structure:
 *   /login                 LoginPage          (public)
 *   /                      AppShell           (protected wrapper)
 *     index                DashboardPage      (Group 2 ✓)
 *     /patients/new        PatientFormPage    (Group 4 ✓)
 *     /patients            PatientSearchPage  (Group 3 ✓)
 *     /patients/:id        PatientDetailPage  (Group 3 ✓)
 *     /patients/:id/edit   PatientFormPage    (Group 4 ✓)
 *     /visits/new          VisitOpenPage      (Group 5 ✓)
 *     /visits/:id          VisitDetailPage    (Group 6 ✓)
 *     /visits/:id/edit     VisitEditPage      (Group 6 ✓)
 *     /visits/:id/close    VisitClosePage     (Group 6 ✓)
 *     /reports             ReportsPage        (Phase 4 ✓)
 *     /admin               AdminPage          (Phase 4 ✓)
 *
 * Route ordering notes:
 *   - patients/new before patients/:id  (literal 'new' must not match :id)
 *   - visits/new  before visits/:id    (same reason)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

/* UI Pages */
import AppShell from '@/components/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import PatientFormPage from '@/pages/PatientFormPage'
import PatientSearchPage from '@/pages/PatientSearchPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import VisitClosePage from './pages/VisitClosePage'
import VisitDetailPage from '@/pages/VisitDetailPage'
import VisitEditPage from './pages/VisitEditPage'
import VisitOpenPage from './pages/VisitOpenPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all routes inside AppShell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              {/* patients/new before patients/:id */}
              <Route path="patients/new" element={<PatientFormPage />} />
              <Route path="patients" element={<PatientSearchPage />} />
              <Route path="patients/:id" element={<PatientDetailPage />} />
              <Route path="patients/:id/edit" element={<PatientFormPage />} />
              {/* visits/new before visits/:id */}
              <Route path="visits/new" element={<VisitOpenPage />} />
              <Route path="visits/:id" element={<VisitDetailPage />} />
              <Route path="visits/:id/edit"  element={<VisitEditPage />} />
              <Route path="visits/:id/close" element={<VisitClosePage />} />
              <Route path="reports" element={<PlaceholderPage title="Reports" />} />
              <Route path="admin" element={<PlaceholderPage title="Admin" />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
