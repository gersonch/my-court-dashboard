import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { LoginPage } from '@/pages/LoginPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { ComplexPage } from '@/pages/ComplexPage'
import { FieldsPage } from '@/pages/FieldsPage'
import { ReservationsPage } from '@/pages/ReservationsPage'
import { TournamentsPage } from '@/pages/TournamentsPage'

export default function App() {
  const owner = useAuthStore(state => state.owner)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={owner ? <DashboardLayout key={owner.id} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<OverviewPage />} />
          <Route path="complex" element={<ComplexPage />} />
          <Route path="fields" element={<FieldsPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
