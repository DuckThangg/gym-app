import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ScanFace, Package, CreditCard, BarChart3, Settings, Dumbbell } from 'lucide-react'
import { useGymStore } from '../../store/gymStore'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/members',     icon: Users,           label: 'Hội viên' },
  { to: '/attendance',  icon: ScanFace,        label: 'Điểm danh' },
  { to: '/packages',    icon: Package,         label: 'Gói tập' },
  { to: '/payments',    icon: CreditCard,      label: 'Thanh toán' },
  { to: '/reports',     icon: BarChart3,       label: 'Báo cáo' },
]

export default function Sidebar() {
  const open = useGymStore(s => s.sidebarOpen)
  return (
    <aside style={{
      width: open ? 220 : 64, minWidth: open ? 220 : 64,
      background: '#0f1a10', borderRight: '1px solid #1e2b1f',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: open ? '24px 20px 20px' : '24px 0 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: open ? 'flex-start' : 'center',
        borderBottom: '1px solid #1e2b1f',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#22c55e', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Dumbbell size={18} color="#052e16" strokeWidth={2.5} />
        </div>
        {open && (
          <div>
            <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 15, color: '#e8f5e9', lineHeight: 1.1 }}>GYM</div>
            <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 15, color: '#22c55e', lineHeight: 1.1 }}>MANAGER</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: open ? '9px 12px' : '9px 0',
              justifyContent: open ? 'flex-start' : 'center',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none',
              fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500,
              color: isActive ? '#22c55e' : '#7a9e7e',
              background: isActive ? '#052e16' : 'transparent',
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = '#e8f5e9' }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = '#7a9e7e' }}
          >
            <Icon size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {open && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: open ? '12px 20px' : '12px 0',
        borderTop: '1px solid #1e2b1f',
        fontSize: 11, color: '#3d5c3f', textAlign: open ? 'left' : 'center',
      }}>
        {open ? 'v1.0.0 · Local' : '●'}
      </div>
    </aside>
  )
}
