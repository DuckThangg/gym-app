import axios from './axios'
const BASE = import.meta.env.VITE_API_URL

export const login  = (d) => axios.post(`${BASE}/index.php?route=auth&action=login`, d)
export const logout = ()  => axios.post(`${BASE}/index.php?route=auth&action=logout`)