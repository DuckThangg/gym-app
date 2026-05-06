import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import PrivateRoute  from './components/layout/PrivateRoute'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Members      from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import Attendance   from './pages/Attendance'
import Packages     from './pages/Packages'
import Payments     from './pages/Payments'
import Reports      from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e2b1f', color: '#e8f5e9', border: '1px solid #2a3d2b' },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/"            element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/members"     element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/members/:id" element={<PrivateRoute><MemberDetail /></PrivateRoute>} />
        <Route path="/attendance"  element={<PrivateRoute><Attendance /></PrivateRoute>} />
        <Route path="/packages"    element={<PrivateRoute><Packages /></PrivateRoute>} />
        <Route path="/payments"    element={<PrivateRoute><Payments /></PrivateRoute>} />
        <Route path="/reports"     element={<PrivateRoute><Reports /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}