/**
 * App.tsx
 * Root router configuration.
 *
 * Route structure:
 *   /login                 LoginPage          (public)
 *   /                      AppShell           (protected wrapper)
 *     index                DashboardPage      (Group 2 placeholder)
 *     /patients            PatientSearchPage  (Group 3 placeholder)
 *     /patients/:id        PatientDetailPage  (Group 3 placeholder)
 *     /patients/new        PatientFormPage    (Group 4 placeholder)
 *     /patients/:id/edit   PatientFormPage    (Group 4 placeholder)
 *     /visits/:id          VisitDetailPage    (Group 7 placeholder)
 *     /visits/:id/open     VisitOpenPage      (Group 5 placeholder)
 *     /visits/:id/edit     VisitEditPage      (Group 6 placeholder)
 *     /visits/:id/close    VisitClosePage     (Group 6 placeholder)
 *     /reports             ReportsPage        (Phase 4)
 *     /admin               AdminPage          (Phase 4)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import LoginPage from '@/pages/LoginPage'
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
              <Route index element={<PlaceholderPage title="Dashboard" />} />
              <Route path="patients" element={<PlaceholderPage title="Patient Search" />} />
              <Route path="patients/new" element={<PlaceholderPage title="New Patient" />} />
              <Route path="patients/:id" element={<PlaceholderPage title="Patient Detail" />} />
              <Route path="patients/:id/edit" element={<PlaceholderPage title="Edit Patient" />} />
              <Route path="visits/:id" element={<PlaceholderPage title="Visit Detail" />} />
              <Route path="visits/:id/open" element={<PlaceholderPage title="Open Visit" />} />
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
