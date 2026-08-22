import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { EsncardPage } from './pages/legacy/EsncardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ArchivePage } from './pages/ArchivePage'
import { FormBuilderPage } from './pages/FormBuilderPage'
import { PublicFormPage } from './pages/PublicFormPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

function DashboardLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/legacy/esncard" element={<EsncardPage />} />
      <Route path="/forms/:slug" element={<PublicFormPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/archive" element={<ArchivePage />} />
          <Route path="/dashboard/forms/:formId/edit" element={<FormBuilderPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
