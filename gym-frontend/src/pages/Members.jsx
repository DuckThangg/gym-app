import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Table from '../components/ui/Table'
import { getMembers, createMember, deleteMember } from '../api/members'
import { getPackages } from '../api/packages'
import { fmt, daysLeft } from '../utils/formatDate'
import { fmtVND } from '../utils/formatCurrency'
import { Plus, Search, Trash2, Eye } from 'lucide-react'
import dayjs from 'dayjs'

const EMPTY = {
  full_name:'', phone:'', email:'', gender:'male', date_of_birth:'',
  address:'', package_id:'', start_date: dayjs().format('YYYY-MM-DD'),
  end_date:'', status:'active', notes:'',
  amount:'', discount:'0', payment_method:'cash',
}

export default function Members() {
  const navigate = useNavigate()
  const [members,  setMembers]  = useState([])
  const [packages, setPackages] = useState([])
  const [total,    setTotal]    = useState(0)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

const load = () => {
  setLoading(true)
  getMembers({ search, status, page, limit: 20 })
    .then(r => {
      setMembers(r.data.data?.members || [])
      setTotal(r.data.data?.total || 0)
    })
    .catch(e => {
      toast.error(e.response?.data?.message || 'Lỗi tải dữ liệu')
      setMembers([])
    })
    .finally(() => setLoading(false))
}

  useEffect(() => { load() }, [search, status, page])
  useEffect(() => {
  getPackages()
    .then(r => setPackages(r.data.data || []))
    .catch(() => setPackages([]))
}, [])

  const onPkgChange = (pkgId) => {
    const pkg = packages.find(p => p.id == pkgId)
    if (pkg && form.start_date) {
      const end = dayjs(form.start_date).add(pkg.duration_days, 'day').format('YYYY-MM-DD')
      setForm(f => ({ ...f, package_id: pkgId, end_date: end, amount: pkg.price }))
    } else {
      setForm(f => ({ ...f, package_id: pkgId }))
    }
  }

  const handleSave = async () => {
    if (!form.full_name || !form.phone) return toast.error('Vui lòng nhập họ tên và SĐT')
    setSaving(true)
    try {
      await createMember(form)
      toast.success('Đã thêm hội viên')
      setModal(false); setForm(EMPTY); load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const handleDelete = async (m, e) => {
    e.stopPropagation()
    if (!confirm(`Xóa hội viên "${m.full_name}"?`)) return
    try {
      await deleteMember(m.id)
      toast.success('Đã xóa'); load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lỗi')
    }
  }

  const cols = [
    { key: 'full_name', label: 'Họ tên', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#1e2b1f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#22c55e', flexShrink: 0,
        }}>{v?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#7a9e7e' }}>{row.phone}</div>
        </div>
      </div>
    )},
    { key: 'package_name', label: 'Gói tập', render: v => v || <span style={{ color: '#7a9e7e' }}>—</span> },
    { key: 'end_date',     label: 'Hết hạn', render: (v, row) => {
      const d = daysLeft(v)
      return v ? (
        <div>
          <div>{fmt(v)}</div>
          <div style={{ fontSize: 11, color: d < 0 ? '#f87171' : d < 7 ? '#fbbf24' : '#7a9e7e' }}>
            {d < 0 ? `Hết hạn ${-d} ngày trước` : d === 0 ? 'Hết hạn hôm nay' : `Còn ${d} ngày`}
          </div>
        </div>
      ) : '—'
    }},
    { key: 'status',   label: 'Trạng thái', render: v => <Badge status={v} /> },
    { key: 'created_at', label: 'Ngày tạo', render: v => fmt(v) },
    { key: '_actions', label: '', render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/members/${row.id}`)}><Eye size={13} /></Button>
        <Button size="sm" variant="danger" onClick={e => handleDelete(row, e)}><Trash2 size={13} /></Button>
      </div>
    )},
  ]

  return (
    <Layout title="Hội viên">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7a9e7e' }} />
          <input placeholder="Tìm theo tên, SĐT..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: 36 }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          style={{ width: 140 }}>
          <option value="">Tất cả</option>
          <option value="active">Còn hạn</option>
          <option value="expired">Hết hạn</option>
          <option value="suspended">Tạm khóa</option>
        </select>
        <Button onClick={() => setModal(true)}><Plus size={14} /> Thêm hội viên</Button>
      </div>

      {/* Table */}
      <div style={{ background: '#111a14', border: '1px solid #1e2b1f', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e2b1f', fontSize: 12, color: '#7a9e7e' }}>
          {total} hội viên
        </div>
        {loading
          ? <div style={{ padding: 40, textAlign: 'center', color: '#7a9e7e' }}>Đang tải...</div>
          : <Table columns={cols} data={members} onRowClick={r => navigate(`/members/${r.id}`)} />
        }
        {/* Pagination */}
        {total > 20 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1e2b1f', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</Button>
            <span style={{ color: '#7a9e7e', fontSize: 12, alignSelf: 'center' }}>Trang {page}</span>
            <Button size="sm" variant="ghost" disabled={members.length < 20} onClick={() => setPage(p => p + 1)}>Sau →</Button>
          </div>
        )}
      </div>

      {/* Modal thêm hội viên */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY) }} title="Thêm hội viên mới" width={600}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Họ và tên *', key: 'full_name', placeholder: 'Nguyễn Văn A' },
            { label: 'Số điện thoại *', key: 'phone', placeholder: '0901234567' },
            { label: 'Email', key: 'email', placeholder: 'example@email.com' },
            { label: 'Ngày sinh', key: 'date_of_birth', type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input type={f.type || 'text'} placeholder={f.placeholder}
                value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Giới tính</label>
            <select value={form.gender} onChange={e => setForm(v => ({ ...v, gender: e.target.value }))}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Gói tập</label>
            <select value={form.package_id} onChange={e => onPkgChange(e.target.value)}>
              <option value="">-- Chọn gói --</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} — {fmtVND(p.price)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Ngày bắt đầu</label>
            <input type="date" value={form.start_date} onChange={e => setForm(v => ({ ...v, start_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Ngày hết hạn</label>
            <input type="date" value={form.end_date} onChange={e => setForm(v => ({ ...v, end_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Số tiền thu</label>
            <input type="number" value={form.amount} onChange={e => setForm(v => ({ ...v, amount: e.target.value }))} placeholder="0" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Phương thức</label>
            <select value={form.payment_method} onChange={e => setForm(v => ({ ...v, payment_method: e.target.value }))}>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Địa chỉ</label>
            <input value={form.address} onChange={e => setForm(v => ({ ...v, address: e.target.value }))} placeholder="Địa chỉ..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))}
              rows={2} style={{ resize: 'vertical' }} placeholder="Ghi chú thêm..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="ghost" onClick={() => { setModal(false); setForm(EMPTY) }}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm hội viên'}</Button>
        </div>
      </Modal>
    </Layout>
  )
}
