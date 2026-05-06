export default function Badge({ status }) {
  const map = {
    active:    { label: 'Còn hạn',   color: '#22c55e', bg: '#052e16' },
    expired:   { label: 'Hết hạn',   color: '#f87171', bg: '#2d0a0a' },
    suspended: { label: 'Tạm khóa',  color: '#fbbf24', bg: '#2d1e00' },
    in_gym:    { label: 'Đang ở',    color: '#60a5fa', bg: '#0a1628' },
    left:      { label: 'Đã ra',     color: '#7a9e7e', bg: '#182018' },
  }
  const s = map[status] || { label: status, color: '#7a9e7e', bg: '#182018' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}
