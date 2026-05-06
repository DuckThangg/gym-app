import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()
  if (!form.username || !form.password) return toast.error('Nhập đầy đủ thông tin')
  setLoading(true)
  try {
    const res = await login(form)
    const { full_name } = res.data.data
    localStorage.setItem('gym_user_name', full_name)
    toast.success(`Chào mừng, ${full_name}!`)
    navigate('/', { replace: true })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Đăng nhập thất bại')
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 400, padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#22c55e',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 0 32px #22c55e44',
          }}>
            <Dumbbell size={32} color="#052e16" strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontFamily: "'Syne'", fontWeight: 800,
            fontSize: 28, color: '#e8f5e9', marginBottom: 4,
          }}>GYM MANAGER</h1>
          <p style={{ color: '#7a9e7e', fontSize: 13 }}>
            Đăng nhập để quản lý phòng gym
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: '#111a14', border: '1px solid #1e2b1f',
          borderRadius: 16, padding: 32,
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 12, color: '#7a9e7e',
                display: 'block', marginBottom: 6, fontWeight: 500,
              }}>TÊN ĐĂNG NHẬP</label>
              <input
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 12, color: '#7a9e7e',
                display: 'block', marginBottom: 6, fontWeight: 500,
              }}>MẬT KHẨU</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 12,
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: '#7a9e7e', cursor: 'pointer',
                    display: 'flex', padding: 0,
                  }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#15803d' : '#22c55e',
                color: '#052e16', border: 'none',
                borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Syne'", fontWeight: 700, fontSize: 15,
                transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 0 20px #22c55e33',
              }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

            <div style={{
              marginTop: 20, padding: '12px 16px',
              background: '#0a0f0d', borderRadius: 8,
              fontSize: 12, color: '#7a9e7e', textAlign: 'center',
              borderTop: '1px solid #1e2b1f',
            }}>
              🔒 Hệ thống quản lý nội bộ — chỉ dành cho quản trị viên
            </div>
        </div>
      </div>
    </div>
  )
}