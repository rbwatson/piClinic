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
 *     /visits/new          VisitOpenPage      (Group 5 placeholder)
 *     /visits/:id          VisitDetailPage    (Group 7 placeholder)
 *     /visits/:id/edit     VisitEditPage      (Group 6 placeholder)
 *     /visits/:id/close    VisitClosePage     (Group 6 placeholder)
 *     /reports             ReportsPage        (Phase 4)
 *     /admin               AdminPage          (Phase 4)
 *
 * Route ordering notes:
 *   - patients/new before patients/:id  (literal 'new' must not match :id)
 *   - visits/new  before visits/:id    (same reason)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PatientSearchPage from '@/pages/PatientSearchPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import PatientFormPage from '@/pages/PatientFormPage'
import PlaceholderPage from '@/pages/PlaceholderPage'

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
              <Route path="visits/new" element={<PlaceholderPage title="Open Visit" />} />
              <Route path="visits/:id" element={<PlaceholderPage title="Visit Detail" />} />
              <Route path="visits/:id/edit" element={<PlaceholderPage title="Edit Visit" />} />
              <Route path="visits/:id/close" element={<PlaceholderPage title="Close Visit" />} />
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
