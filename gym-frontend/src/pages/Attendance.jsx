import { useEffect, useRef, useState } from 'react'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { checkIn, checkOut, getAttendance } from '../api/attendance'
import { pyStartCamera, pyStopCamera, pyStatus, streamUrl } from '../api/python'
import { getMembers } from '../api/members'
import { fmtTime, fmt } from '../utils/formatDate'
import toast from 'react-hot-toast'
import { Camera, CameraOff, UserCheck, UserX, RefreshCw } from 'lucide-react'

export default function Attendance() {
  const [cameraOn,  setCameraOn]  = useState(false)
  const [records,   setRecords]   = useState([])
  const [stats,     setStats]     = useState(null)
  const [members,   setMembers]   = useState([])
  const [manualId,  setManualId]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [pyOnline,  setPyOnline]  = useState(false)
  const streamRef = useRef(null)
  const today = new Date().toISOString().slice(0, 10)

const loadAttendance = () =>
  getAttendance({ date: today })
    .then(r => {
      setRecords(r.data.data?.records || [])
      setStats(r.data.data?.stats || null)
    })
    .catch(() => { setRecords([]); setStats(null) })

  const checkPython = () =>
    pyStatus().then(r => {
      setPyOnline(true)
      setCameraOn(r.data.data.camera_running)
    }).catch(() => setPyOnline(false))

useEffect(() => {
  loadAttendance()
  getMembers({ limit: 200 })
    .then(r => setMembers(r.data.data?.members || []))
    .catch(() => setMembers([]))
  checkPython()
  const t = setInterval(() => { loadAttendance(); checkPython() }, 10000)
  return () => clearInterval(t)
}, [])

  const toggleCamera = async () => {
    setLoading(true)
    try {
      if (cameraOn) { await pyStopCamera(); setCameraOn(false); toast.success('Đã tắt camera') }
      else          { await pyStartCamera(); setCameraOn(true); toast.success('Đã bật camera') }
    } catch { toast.error('Không kết nối được Python service') }
    finally { setLoading(false) }
  }

  const handleManualCheckin = async () => {
    if (!manualId) return toast.error('Chọn hội viên')
    try {
      await checkIn({ member_id: parseInt(manualId), method: 'manual' })
      toast.success('Check-in thành công')
      setManualId(''); loadAttendance()
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  }

  const handleCheckout = async (memberId, name) => {
    try {
      await checkOut({ member_id: memberId })
      toast.success(`${name} đã check-out`)
      loadAttendance()
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  }

  return (
    <Layout title="Điểm danh">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>

        {/* Camera panel */}
        <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #1e2b1f',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: pyOnline ? '#22c55e' : '#f87171',
                animation: pyOnline ? 'pulse-dot 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {pyOnline ? 'Python service online' : 'Python service offline'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => { loadAttendance(); checkPython() }}>
                <RefreshCw size={13} />
              </Button>
              <Button size="sm" variant={cameraOn ? 'danger' : 'primary'}
                onClick={toggleCamera} disabled={loading || !pyOnline}>
                {cameraOn ? <><CameraOff size={13} /> Tắt camera</> : <><Camera size={13} /> Bật camera</>}
              </Button>
            </div>
          </div>

          {/* Video stream */}
          <div style={{
            background: '#0a0f0d', minHeight: 360,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {cameraOn && pyOnline ? (
              <img
                ref={streamRef}
                src={streamUrl()}
                alt="Camera stream"
                style={{ width: '100%', display: 'block' }}
                onError={() => setCameraOn(false)}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#3d5c3f' }}>
                <Camera size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13 }}>
                  {!pyOnline ? 'Chạy python app.py để bật service' : 'Nhấn "Bật camera" để bắt đầu nhận diện'}
                </div>
              </div>
            )}
          </div>

          {/* Manual check-in */}
          <div style={{ padding: 16, borderTop: '1px solid #1e2b1f' }}>
            <div style={{ fontSize: 12, color: '#7a9e7e', marginBottom: 8, fontWeight: 500 }}>ĐIỂM DANH THỦ CÔNG</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={manualId} onChange={e => setManualId(e.target.value)} style={{ flex: 1 }}>
                <option value="">-- Chọn hội viên --</option>
                {members.filter(m => m.status === 'active').map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} — {m.phone}</option>
                ))}
              </select>
              <Button onClick={handleManualCheckin} disabled={!manualId}>
                <UserCheck size={14} /> Check-in
              </Button>
            </div>
          </div>
        </div>

        {/* Attendance log */}
        <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2b1f' }}>
            <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              Hôm nay · {fmt(today, 'DD/MM/YYYY')}
            </div>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Trong phòng', value: stats.currently_in_gym ?? 0, color: '#22c55e' },
                  { label: 'Lượt vào',    value: stats.total_checkins ?? 0,   color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#0f1a10', borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 20, fontFamily: "'Syne'", fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#7a9e7e' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {records.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#7a9e7e', fontSize: 13 }}>Chưa có ai vào hôm nay</div>
              : records.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderBottom: '1px solid #1a231b',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: '#1e2b1f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#22c55e', flexShrink: 0,
                  }}>{r.full_name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#7a9e7e' }}>
                      {fmtTime(r.check_in)}{r.check_out ? ` → ${fmtTime(r.check_out)}` : ' → đang ở'}
                      {r.method === 'face' && ' · 🤖'}
                    </div>
                  </div>
                  {!r.check_out && (
                    <button onClick={() => handleCheckout(r.member_id, r.full_name)}
                      title="Check-out"
                      style={{
                        background: 'none', border: '1px solid #2a3d2b',
                        borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#7a9e7e',
                        display: 'flex',
                      }}>
                      <UserX size={13} />
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </Layout>
  )
}
