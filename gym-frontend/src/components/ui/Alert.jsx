export default function Alert({ type = 'info', children }) {
  const map = {
    info:    { bg: '#0a1628', border: '#60a5fa44', color: '#60a5fa' },
    success: { bg: '#052e16', border: '#22c55e44', color: '#22c55e' },
    warning: { bg: '#2d1e00', border: '#fbbf2444', color: '#fbbf24' },
    danger:  { bg: '#2d0a0a', border: '#f8717144', color: '#f87171' },
  }
  const s = map[type]
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: '12px 16px', color: s.color, fontSize: 13,
    }}>{children}</div>
  )
}
