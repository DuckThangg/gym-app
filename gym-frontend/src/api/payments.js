import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const getPayments   = (p) => axios.get(`${BASE}/index.php?route=payments`, { params: p })
export const createPayment = (d) => axios.post(`${BASE}/index.php?route=payments&action=create`, d)
export const getSummary    = (p) => axios.get(`${BASE}/index.php?route=payments&action=summary`, { params: p })