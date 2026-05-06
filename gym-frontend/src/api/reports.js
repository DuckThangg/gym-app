import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const getDailyReport   = (date) => axios.get(`${BASE}/index.php?route=reports&action=daily`, { params: { date } })
export const getMonthlyReport = (p)    => axios.get(`${BASE}/index.php?route=reports&action=monthly`, { params: p })