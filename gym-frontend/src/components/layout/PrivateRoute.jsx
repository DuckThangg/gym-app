import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import axios from '../../api/axios'

export default function PrivateRoute({ children }) {
  const [status, setStatus] = useState('checking') // checking | ok | fail

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL
    axios.get(`${BASE}/index.php?route=auth&action=check`)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('fail'))
  }, [])

  if (status === 'checking') return (
    <div style={{
      height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0f0d', color: '#7a9e7e', fontSize: 13,
    }}>Đang kiểm tra đăng nhập...</div>
  )

  if (status === 'fail') return <Navigate to="/login" replace />
  return children
}