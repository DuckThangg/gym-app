import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getDailyReport } from '../api/reports'
import { getSummary } from '../api/payments'
import { fmtVND } from '../utils/formatCurrency'
import { fmtTime, fmt } from '../utils/formatDate'
import Badge from '../components/ui/Badge'
import { Users, TrendingUp, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { useGymStore } from '../store/gymStore'

function StatCard({ icon: Icon, label, value, sub, color = '#22c55e' }) {
  return (
    <div style={{
      background: '#111a14', border: '1px solid #1e2b1f',
      borderRadius: 14, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#7a9e7e', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ background: `${color}18`, borderRadius: 8, padding: 8 }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontFamily: "'Syne'", fontWeight: 700, color: '#e8f5e9', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#7a9e7e', marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const setNotifications = useGymStore(s => s.setNotifications)
  const today = new Date().toISOString().slice(0, 10)

useEffect(() => {
  Promise.all([getDailyReport(today), getSummary({ year: new Date().getFullYear() })])
    .then(([r, s]) => {
      setData(r.data.data || {})
      setRevenue(s.data.data || {})
      setNotifications(r.data.data?.expiring || [])
    })
    .catch(() => {
      setData({})
      setRevenue({})
    })
    .finally(() => setLoading(false))
}, [])

  if (loading) return (
    <Layout title="Tổng quan">
      <div style={{ color: '#7a9e7e', padding: 40, textAlign: 'center' }}>Đang tải...</div>
    </Layout>
  )

  const att = data?.attendance || {}
  const rev = data?.revenue || {}
  const thisMonth = revenue?.monthly?.find(m => m.month === new Date().getMonth() + 1)

  return (
    <Layout title="Tổng quan">
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users}       label="Trong phòng"  value={att.currently_in ?? 0}   sub={`${att.unique_visitors ?? 0} lượt vào hôm nay`} />
        <StatCard icon={TrendingUp}  label="Hội viên mới" value={data?.new_members ?? 0}  sub="hôm nay" color="#60a5fa" />
        <StatCard icon={DollarSign}  label="Doanh thu tháng" value={fmtVND(thisMonth?.net_revenue ?? 0)} sub={`${thisMonth?.total_payments ?? 0} giao dịch`} color="#fbbf24" />
        <StatCard icon={AlertTriangle} label="Sắp hết hạn" value={data?.expiring?.length ?? 0} sub="trong 7 ngày tới" color="#f87171" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Visitors today */}
        <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2b1f' }}>
            <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700 }}>Lượt vào hôm nay</h2>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {(data?.visitors || []).length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#7a9e7e' }}>Chưa có ai vào hôm nay</div>
              : (data?.visitors || []).map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px', borderBottom: '1px solid #1a231b',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#1e2b1f', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, fontWeight: 700,
                    color: '#22c55e', flexShrink: 0,
                  }}>
                    {v.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{v.full_name}</div>
                    <div style={{ fontSize: 11, color: '#7a9e7e' }}>
                      Vào: {fmtTime(v.check_in)}
                      {v.check_out && ` · Ra: ${fmtTime(v.check_out)}`}
                      {v.duration_minutes > 0 && ` · ${v.duration_minutes} phút`}
                    </div>
                  </div>
                  <Badge status={v.current_status} />
                </div>
              ))
            }
          </div>
        </div>

        {/* Expiring soon */}
        <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2b1f', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#f87171" />
            <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700, color: '#f87171' }}>Sắp hết hạn</h2>
          </div>
          <div>
            {(data?.expiring || []).length === 0
              ? <div style={{ padding: 24, textAlign: 'center', color: '#7a9e7e', fontSize: 13 }}>Không có ai sắp hết hạn</div>
              : (data?.expiring || []).map(m => (
                <div key={m.id} style={{
                  padding: '12px 20px', borderBottom: '1px solid #1a231b',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{m.full_name}</div>
                  <div style={{ fontSize: 11, color: '#7a9e7e' }}>{m.phone} · {m.package_name}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: m.days_remaining === 0 ? '#f87171' : '#fbbf24',
                  }}>
                    {m.days_remaining === 0 ? 'Hết hạn hôm nay!' : `Còn ${m.days_remaining} ngày — ${fmt(m.end_date)}`}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </Layout>
  )
}
