import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import { getPayments, createPayment } from '../api/payments'
import { getMembers } from '../api/members'
import { getPackages } from '../api/packages'
import { fmt } from '../utils/formatDate'
import { fmtVND } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import { Plus, CreditCard } from 'lucide-react'
import dayjs from 'dayjs'

const EMPTY = { member_id: '', package_id: '', amount: '', discount: '0', payment_method: 'cash', start_date: dayjs().format('YYYY-MM-DD'), notes: '' }

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [members,  setMembers]  = useState([])
  const [packages, setPackages] = useState([])
  const [month,    setMonth]    = useState(dayjs().format('YYYY-MM'))
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = () =>
    getPayments({ month })
      .then(r => setPayments(r.data.data?.payments || []))
      .catch(() => setPayments([]))

  useEffect(() => {
    getMembers({ limit: 200 })
      .then(r => setMembers(r.data.data?.members || []))
      .catch(() => setMembers([]))
    getPackages()
      .then(r => setPackages(r.data.data || []))
      .catch(() => setPackages([]))
  }, [])

  useEffect(() => { load() }, [month])

  const onPkgChange = (pkgId) => {
    const pkg = packages.find(p => p.id == pkgId)
    setForm(f => ({ ...f, package_id: pkgId, amount: pkg?.price || '' }))
  }

  const handleSave = async () => {
    if (!form.member_id || !form.package_id || !form.amount) return toast.error('Điền đầy đủ thông tin')
    setSaving(true)
    try {
      await createPayment(form)
      toast.success('Thanh toán thành công'); setModal(false); setForm(EMPTY); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
    finally { setSaving(false) }
  }

  const cols = [
    { key: 'full_name',      label: 'Hội viên', render: (v, r) => <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: '#7a9e7e' }}>{r.phone}</div></div> },
    { key: 'package_name',   label: 'Gói tập' },
    { key: 'amount',         label: 'Số tiền',  render: v => <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmtVND(v)}</span> },
    { key: 'discount',       label: 'Giảm giá', render: v => v > 0 ? fmtVND(v) : '—' },
    { key: 'payment_method', label: 'Phương thức', render: v => ({ cash: 'Tiền mặt', transfer: 'Chuyển khoản', other: 'Khác' })[v] },
    { key: 'start_date',     label: 'Bắt đầu',  render: v => fmt(v) },
    { key: 'end_date',       label: 'Hết hạn',  render: v => fmt(v) },
    { key: 'payment_date',   label: 'Ngày thu',  render: v => fmt(v) },
  ]

  const total = payments.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <Layout title="Thanh toán">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }} />
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: '#7a9e7e' }}>
          Tổng: <span style={{ color: '#22c55e', fontWeight: 700, fontFamily: "'Syne'" }}>{fmtVND(total)}</span>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={14} /> Ghi thanh toán</Button>
      </div>

      <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
        <Table columns={cols} data={payments} />
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY) }} title="Ghi nhận thanh toán">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Hội viên *</label>
            <select value={form.member_id} onChange={e => setForm(v => ({ ...v, member_id: e.target.value }))}>
              <option value="">-- Chọn hội viên --</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name} — {m.phone}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Gói tập *</label>
            <select value={form.package_id} onChange={e => onPkgChange(e.target.value)}>
              <option value="">-- Chọn gói --</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} — {fmtVND(p.price)}</option>)}
            </select>
          </div>
          {[
            { label: 'Số tiền thu *', key: 'amount',     type: 'number' },
            { label: 'Giảm giá',      key: 'discount',   type: 'number' },
            { label: 'Ngày bắt đầu',  key: 'start_date', type: 'date'   },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Phương thức</label>
            <select value={form.payment_method} onChange={e => setForm(v => ({ ...v, payment_method: e.target.value }))}>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => { setModal(false); setForm(EMPTY) }}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              <CreditCard size={14} />{saving ? 'Đang lưu...' : 'Xác nhận thanh toán'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}