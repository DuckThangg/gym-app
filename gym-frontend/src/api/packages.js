import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const getPackages   = (p)     => axios.get(`${BASE}/index.php?route=packages`, { params: p })
export const createPackage = (d)     => axios.post(`${BASE}/index.php?route=packages&action=create`, d)
export const updatePackage = (id, d) => axios.put(`${BASE}/index.php?route=packages&action=update&id=${id}`, d)
export const deletePackage = (id)    => axios.delete(`${BASE}/index.php?route=packages&action=delete&id=${id}`)