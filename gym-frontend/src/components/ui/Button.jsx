export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 12 : 14,
    padding: size === 'sm' ? '5px 12px' : '8px 18px',
  }
  const variants = {
    primary:  { background: '#22c55e', color: '#052e16' },
    danger:   { background: '#2d0a0a', color: '#f87171', border: '1px solid #f8717133' },
    ghost:    { background: 'transparent', color: '#7a9e7e', border: '1px solid #2a3d2b' },
    outline:  { background: 'transparent', color: '#22c55e', border: '1px solid #22c55e44' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}
