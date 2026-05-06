export default function Table({ columns, data, onRowClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 14px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                color: '#7a9e7e', textTransform: 'uppercase',
                borderBottom: '1px solid #2a3d2b', whiteSpace: 'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: '#7a9e7e' }}>
              Không có dữ liệu
            </td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: '1px solid #1e2b1f',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e2b1f'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 14px', fontSize: 13 }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
