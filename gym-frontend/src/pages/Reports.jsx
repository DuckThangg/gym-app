import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getSummary } from '../api/payments'
import { fmtVND, fmtNum } from '../utils/formatCurrency'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import dayjs from 'dayjs'

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

export default function Reports() {
  const [data,    setData]    = useState(null)
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSummary({ year })
      .then(r => setData(r.data.data || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [year])

  const handleExport = (type) => {
    const BASE = import.meta.env.VITE_API_URL
    const month = dayjs().format('YYYY-MM')
    const params = type === 'payments' || type === 'attendance'
      ? `type=${type}&month=${month}`
      : `type=${type}`
    window.open(`${BASE}/index.php?route=reports&action=export&${params}`, '_blank')
  }

  const chartData = MONTHS.map((m, i) => {
    const found = data?.monthly?.find(d => d.month === i + 1)
    return { name: m, 'Doanh thu': found?.net_revenue || 0, 'Giao dịch': found?.total_payments || 0 }
  })

  const sum = data?.year_summary || {}

  return (
    <Layout title="Báo cáo">

      {/* Nút xuất Excel */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <span style={{ color: '#7a9e7e', fontSize: 13, alignSelf: 'center', marginRight: 4 }}>
          Xuất Excel:
        </span>
        {[
          { type: 'members',    label: '📋 Danh sách hội viên' },
          { type: 'attendance', label: '📅 Điểm danh tháng này' },
          { type: 'payments',   label: '💰 Doanh thu tháng này' },
        ].map(b => (
          <button key={b.type} onClick={() => handleExport(b.type)}
            style={{
              background: '#111a14', border: '1px solid #2a3d2b',
              borderRadius: 8, padding: '8px 16px',
              color: '#22c55e', cursor: 'pointer',
              fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e2b1f'}
            onMouseLeave={e => e.currentTarget.style.background = '#111a14'}
          >{b.label}</button>
        ))}
      </div>

      {/* Year picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ color: '#7a9e7e', fontSize: 13 }}>Năm:</span>
        {[new Date().getFullYear() - 1, new Date().getFullYear()].map(y => (
          <button key={y} onClick={() => setYear(y)}
            style={{
              background: year === y ? '#22c55e' : '#1e2b1f',
              color: year === y ? '#052e16' : '#7a9e7e',
              border: '1px solid #2a3d2b', borderRadius: 8,
              padding: '5px 14px', cursor: 'pointer',
              fontFamily: "'Syne'", fontWeight: 700, fontSize: 13,
            }}>{y}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng doanh thu', value: fmtVND(sum.total_revenue), color: '#22c55e' },
          { label: 'Đã giảm giá',   value: fmtVND(sum.total_discount), color: '#fbbf24' },
          { label: 'Thực thu',       value: fmtVND(sum.net_revenue),    color: '#60a5fa' },
          { label: 'Giao dịch',      value: fmtNum(sum.total_payments), color: '#e8f5e9' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#111a14', border: '1px solid #1e2b1f',
            borderRadius: 14, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, color: '#7a9e7e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
          Doanh thu theo tháng — {year}
        </h2>
        {loading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a9e7e' }}>
            Đang tải...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2b1f" />
              <XAxis dataKey="name" tick={{ fill: '#7a9e7e', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a9e7e', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000000 ? `${v/1000000}M` : v >= 1000 ? `${v/1000}K` : v} />
              <Tooltip
                contentStyle={{ background: '#1e2b1f', border: '1px solid #2a3d2b', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e8f5e9', fontWeight: 600 }}
                formatter={(v, n) => [n === 'Doanh thu' ? fmtVND(v) : v, n]} />
              <Bar dataKey="Doanh thu" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top packages */}
      {data?.top_packages?.length > 0 && (
        <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2b1f' }}>
            <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700 }}>
              Gói bán chạy — {year}
            </h2>
          </div>
          {data.top_packages.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 20px', borderBottom: '1px solid #1a231b',
            }}>
              <span style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 18, color: '#2a3d2b', width: 24 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#7a9e7e' }}>{p.sold_count} giao dịch</div>
              </div>
              <div style={{ fontFamily: "'Syne'", fontWeight: 700, color: '#22c55e' }}>
                {fmtVND(p.revenue)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}