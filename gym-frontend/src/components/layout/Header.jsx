import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, X, AlertTriangle, ChevronRight, LogOut } from 'lucide-react'
import { useGymStore } from '../../store/gymStore'
import { useNavigate } from 'react-router-dom'
import { fmt } from '../../utils/formatDate'
import { logout } from '../../api/auth'

export default function Header({ title }) {
  const { toggleSidebar, notifications } = useGymStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const unread   = notifications.length
  const userName = localStorage.getItem('gym_user_name') || 'Admin'

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleLogout = async () => {
    await logout().catch(() => {})
    localStorage.removeItem('gym_token')
    localStorage.removeItem('gym_user_name')
    navigate('/login')
  }

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      borderBottom: '1px solid #1e2b1f',
      background: '#0a0f0d',
      position: 'relative', zIndex: 100,
    }}>
      <button onClick={toggleSidebar} style={{
        background: 'none', border: 'none', color: '#7a9e7e',
        cursor: 'pointer', display: 'flex', padding: 4,
      }}>
        <Menu size={18} />
      </button>

      <h1 style={{
        fontFamily: "'Syne'", fontWeight: 700, fontSize: 17,
        color: '#e8f5e9', flex: 1,
      }}>{title}</h1>

      {/* Bell + Dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: open ? '#1e2b1f' : '#111a14',
            border: '1px solid #2a3d2b', borderRadius: 8,
            padding: '6px 8px', cursor: 'pointer',
            color: '#7a9e7e', display: 'flex', transition: 'all 0.15s',
          }}>
          <Bell size={16} color={unread > 0 ? '#fbbf24' : '#7a9e7e'} />
        </button>

        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#f87171', color: '#fff',
            borderRadius: '50%', fontSize: 10, fontWeight: 700,
            width: 17, height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}

        {open && (
          <div className="fade-in" style={{
            position: 'absolute', top: 40, right: 0,
            width: 320, background: '#111a14',
            border: '1px solid #2a3d2b', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #1e2b1f',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="#fbbf24" />
                <span style={{
                  fontFamily: "'Syne'", fontWeight: 700,
                  fontSize: 13, color: '#fbbf24',
                }}>Hội viên sắp hết hạn</span>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none',
                color: '#7a9e7e', cursor: 'pointer', display: 'flex', padding: 2,
              }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: 24, textAlign: 'center',
                  color: '#7a9e7e', fontSize: 13,
                }}>
                  Không có hội viên nào sắp hết hạn 🎉
                </div>
              ) : notifications.map((m, i) => (
                <div
                  key={m.id ?? i}
                  onClick={() => { navigate(`/members/${m.id}`); setOpen(false) }}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #1a231b',
                    cursor: 'pointer', transition: 'background 0.1s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e2b1f'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#2d1e00', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#fbbf24',
                  }}>
                    {m.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500, fontSize: 13,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{m.full_name}</div>
                    <div style={{ fontSize: 11, color: '#7a9e7e', marginTop: 2 }}>
                      {m.package_name} · Hết {fmt(m.end_date)}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, marginTop: 2,
                      color: m.days_remaining === 0 ? '#f87171' : '#fbbf24',
                    }}>
                      {m.days_remaining === 0 ? '⚠ Hết hạn hôm nay!' : `Còn ${m.days_remaining} ngày`}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#3d5c3f" />
                </div>
              ))}
            </div>

            {notifications.length > 0 && (
              <div
                onClick={() => { navigate('/members?status=active'); setOpen(false) }}
                style={{
                  padding: '10px 16px', borderTop: '1px solid #1e2b1f',
                  textAlign: 'center', fontSize: 12,
                  color: '#22c55e', cursor: 'pointer', fontWeight: 500,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e2b1f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Xem tất cả hội viên →
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tên user + Logout */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: '1px solid #1e2b1f', paddingLeft: 16,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#1e2b1f', border: '1px solid #2a3d2b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#22c55e',
        }}>
          {userName[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize: 13, color: '#7a9e7e' }}>{userName}</span>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          style={{
            background: 'none', border: '1px solid #2a3d2b',
            borderRadius: 8, padding: '5px 8px',
            cursor: 'pointer', color: '#7a9e7e',
            display: 'flex', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#f8717144' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7a9e7e'; e.currentTarget.style.borderColor = '#2a3d2b' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}