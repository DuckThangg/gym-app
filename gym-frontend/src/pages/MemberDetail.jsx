import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { getMember, updateMember } from '../api/members'
import { pyRegisterCapture, pyStartCamera, streamUrl, pyStatus } from '../api/python'
import { fmt, fmtDT, daysLeft } from '../utils/formatDate'
import { fmtVND } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import { ArrowLeft, Camera, Save } from 'lucide-react'

export default function MemberDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [member,  setMember]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [faceModal, setFaceModal] = useState(false)
  const [cameraOn, setCameraOn]   = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [editing, setEditing]     = useState(false)
  const [form,    setForm]        = useState({})

const load = () =>
  getMember(id)
    .then(r => {
      setMember(r.data.data || {})
      setForm(r.data.data?.member || {})
    })
    .catch(() => toast.error('Không tải được thông tin hội viên'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const openFaceModal = async () => {
    setFaceModal(true)
    try {
      const s = await pyStatus()
      if (!s.data.data.camera_running) await pyStartCamera()
      setCameraOn(true)
    } catch { toast.error('Python service offline') }
  }

  const handleCapture = async () => {
    setCapturing(true)
    try {
      const PY = import.meta.env.VITE_PYTHON_URL || 'http://localhost:5000'
      const res = await fetch(`${PY}/register/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: parseInt(id) }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Đã đăng ký khuôn mặt thành công!')
      setFaceModal(false)
      load()
    } catch (e) {
      toast.error(e.message || 'Lỗi kết nối')
    } finally {
      setCapturing(false)
    }
  }

  const handleSave = async () => {
    try {
      await updateMember(id, form)
      toast.success('Đã cập nhật'); setEditing(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  }

  if (loading) return <Layout title="..."><div style={{ color: '#7a9e7e', padding: 40 }}>Đang tải...</div></Layout>
  if (!member) return <Layout title="Không tìm thấy"><div /></Layout>

  const m = member.member
  const dl = daysLeft(m.end_date)

  return (
    <Layout title={m.full_name}>
      <div style={{ marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/members')}><ArrowLeft size={14} /> Quay lại</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Left: Profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#1e2b1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#22c55e', margin: '0 auto 16px',
              border: '2px solid #2a3d2b',
            }}>{m.full_name?.[0]?.toUpperCase()}</div>
            <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{m.full_name}</div>
            <div style={{ color: '#7a9e7e', fontSize: 13, marginBottom: 12 }}>{m.phone}</div>
            <Badge status={m.status} />
            <div style={{ marginTop: 16 }}>
              <Button onClick={openFaceModal} style={{ width: '100%' }}><Camera size={14} />
                {m.avatar ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
              </Button>
            </div>
          </div>

          {/* Gói tập */}
          <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#7a9e7e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Gói tập hiện tại</div>
            {m.package_name ? (
              <>
                <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{m.package_name}</div>
                <div style={{ fontSize: 12, color: '#7a9e7e', marginBottom: 4 }}>Từ {fmt(m.start_date)} → {fmt(m.end_date)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: dl < 0 ? '#f87171' : dl < 7 ? '#fbbf24' : '#22c55e' }}>
                  {dl < 0 ? `Hết hạn ${-dl} ngày trước` : dl === 0 ? 'Hết hạn hôm nay' : `Còn ${dl} ngày`}
                </div>
              </>
            ) : <div style={{ color: '#7a9e7e', fontSize: 13 }}>Chưa đăng ký gói</div>}
          </div>

          {/* Stats */}
          <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#7a9e7e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Thống kê</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7a9e7e', fontSize: 13 }}>Tổng lượt vào</span>
                <span style={{ fontWeight: 600 }}>{member.attendance?.total_visits || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#7a9e7e', fontSize: 13 }}>Lần cuối</span>
                <span style={{ fontSize: 12 }}>{fmtDT(member.attendance?.last_visit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info + Payment history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info */}
          <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700 }}>Thông tin</h2>
              {editing
                ? <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                    <Button size="sm" onClick={handleSave}><Save size={13} /> Lưu</Button>
                  </div>
                : <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Sửa</Button>
              }
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Email',    key: 'email' },
                { label: 'Địa chỉ', key: 'address' },
                { label: 'Ghi chú', key: 'notes' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'email' ? 'auto' : '1 / -1' }}>
                  <div style={{ fontSize: 11, color: '#7a9e7e', marginBottom: 4 }}>{f.label}</div>
                  {editing
                    ? <input value={form[f.key] || ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                    : <div style={{ fontSize: 13 }}>{m[f.key] || '—'}</div>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Payment history */}
          <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2b1f' }}>
              <h2 style={{ fontFamily: "'Syne'", fontSize: 14, fontWeight: 700 }}>Lịch sử thanh toán</h2>
            </div>
            {(member.payments || []).length === 0
              ? <div style={{ padding: 24, textAlign: 'center', color: '#7a9e7e', fontSize: 13 }}>Chưa có giao dịch</div>
              : (member.payments || []).map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid #1a231b',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.package_name}</div>
                    <div style={{ fontSize: 11, color: '#7a9e7e' }}>{fmt(p.start_date)} → {fmt(p.end_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#22c55e', fontWeight: 600, fontFamily: "'Syne'" }}>{fmtVND(p.amount)}</div>
                    <div style={{ fontSize: 11, color: '#7a9e7e' }}>{fmt(p.payment_date)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Face registration modal */}
      <Modal open={faceModal} onClose={() => setFaceModal(false)} title="Đăng ký khuôn mặt" width={560}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#0a0f0d', borderRadius: 10, overflow: 'hidden',
            marginBottom: 16, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cameraOn
              ? <img src={streamUrl()} alt="Camera" style={{ width: '100%', display: 'block' }} />
              : <div style={{ color: '#3d5c3f', fontSize: 13 }}>Đang khởi động camera...</div>
            }
          </div>
          <p style={{ color: '#7a9e7e', fontSize: 13, marginBottom: 20 }}>
            Nhìn thẳng vào camera, đảm bảo ánh sáng đủ tốt rồi nhấn chụp.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button variant="ghost" onClick={() => setFaceModal(false)}>Hủy</Button>
            <Button onClick={handleCapture} disabled={!cameraOn || capturing}>
              <Camera size={14} />{capturing ? 'Đang xử lý...' : 'Chụp & đăng ký'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
