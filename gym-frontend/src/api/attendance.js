import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const getAttendance = (p) => axios.get(`${BASE}/index.php?route=attendance`, { params: p })
export const checkIn       = (d) => axios.post(`${BASE}/index.php?route=attendance&action=checkin`, d)
export const checkOut      = (d) => axios.post(`${BASE}/index.php?route=attendance&action=checkout`, d)