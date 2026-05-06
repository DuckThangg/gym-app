import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const getMembers   = (p)     => axios.get(`${BASE}/index.php?route=members`, { params: p })
export const getMember    = (id)    => axios.get(`${BASE}/index.php?route=members&action=show&id=${id}`)
export const createMember = (d)     => axios.post(`${BASE}/index.php?route=members`, d)
export const updateMember = (id, d) => axios.put(`${BASE}/index.php?route=members&action=update&id=${id}`, d)
export const deleteMember = (id)    => axios.delete(`${BASE}/index.php?route=members&action=delete&id=${id}`)