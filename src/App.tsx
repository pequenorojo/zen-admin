import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from '@/context/StoreContext'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { BookingsPage } from '@/pages/BookingsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { TherapistsPage } from '@/pages/TherapistsPage'
import { LocationsPage } from '@/pages/LocationsPage'
import { StoresPage } from '@/pages/StoresPage'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/therapists" element={<TherapistsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/schedules" element={<Placeholder title="排班管理" />} />
            <Route path="/reports" element={<Placeholder title="數據報表" />} />
            <Route path="/settings" element={<Placeholder title="系統設定" />} />
          </Route>
          <Route path="*" element={<Navigate to="/bookings" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-lg text-muted-foreground">{title} — 開發中</p>
    </div>
  )
}
