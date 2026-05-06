import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { getPackages, createPackage, updatePackage, deletePackage } from '../api/packages'
import { fmtVND } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'

const EMPTY = { name: '', duration_days: 30, price: '', description: '', is_active: 1 }

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)

  const load = () =>
    getPackages({ active: 0 })
      .then(r => setPackages(r.data.data || []))
      .catch(() => setPackages([]))

  useEffect(() => { load() }, [])

  const openEdit = (pkg) => { setForm({ ...pkg }); setEditId(pkg.id); setModal(true) }
  const openNew  = ()    => { setForm(EMPTY); setEditId(null); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Nhập tên và giá gói')
    setSaving(true)
    try {
      editId ? await updatePackage(editId, form) : await createPackage(form)
      toast.success(editId ? 'Đã cập nhật' : 'Đã tạo gói tập')
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
    finally { setSaving(false) }
  }

  const handleDelete = async (pkg) => {
    if (!confirm(`Xóa gói "${pkg.name}"?`)) return
    try { await deletePackage(pkg.id); toast.success('Đã xóa'); load() }
    catch (e) { toast.error(e.response?.data?.message || 'Lỗi') }
  }

  return (
    <Layout title="Gói tập">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button onClick={openNew}><Plus size={14} /> Tạo gói mới</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{
            background: '#111a14', border: `1px solid ${pkg.is_active ? '#1e2b1f' : '#2a1a1a'}`,
            borderRadius: 14, padding: 20, opacity: pkg.is_active ? 1 : 0.6,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ background: '#052e16', borderRadius: 8, padding: 8 }}>
                <Package size={18} color="#22c55e" />
              </div>
              {!pkg.is_active && (
                <span style={{ fontSize: 11, color: '#f87171', background: '#2d0a0a', padding: '2px 8px', borderRadius: 6 }}>Ẩn</span>
              )}
            </div>
            <div>
              <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{pkg.name}</div>
              {pkg.description && <div style={{ fontSize: 12, color: '#7a9e7e' }}>{pkg.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#7a9e7e' }}>Thời hạn</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{pkg.duration_days} ngày</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#7a9e7e' }}>Đang dùng</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{pkg.member_count} hội viên</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontFamily: "'Syne'", fontWeight: 800, color: '#22c55e' }}>
              {fmtVND(pkg.price)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)} style={{ flex: 1 }}>
                <Pencil size={13} /> Sửa
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(pkg)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Sửa gói tập' : 'Tạo gói tập mới'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Tên gói *',    key: 'name',          type: 'text',   placeholder: 'Gói 1 tháng' },
            { label: 'Số ngày *',    key: 'duration_days', type: 'number', placeholder: '30' },
            { label: 'Giá (VNĐ) *', key: 'price',         type: 'number', placeholder: '300000' },
            { label: 'Mô tả',        key: 'description',   type: 'text',   placeholder: 'Mô tả gói tập...' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: '#7a9e7e', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                value={form[f.key] || ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
            </div>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.is_active}
              onChange={e => setForm(v => ({ ...v, is_active: e.target.checked ? 1 : 0 }))}
              style={{ width: 'auto', accentColor: '#22c55e' }} />
            <span style={{ fontSize: 13, color: '#e8f5e9' }}>Hiện gói (đang bán)</span>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setModal(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}