import axios from 'axios'
const PY = import.meta.env.VITE_PYTHON_URL

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('gym_token')}` }
})

export const pyStatus       = ()   => axios.get(`${PY}/status`)
export const pyStartCamera  = ()   => axios.post(`${PY}/camera/start`)
export const pyStopCamera   = ()   => axios.post(`${PY}/camera/stop`)
export const pyResults      = ()   => axios.get(`${PY}/results`)
export const pyReload       = ()   => axios.post(`${PY}/reload`)
export const pyRegisterCapture = (member_id) => axios.post(`${PY}/register/capture`, { member_id })
export const pyRegisterUpload  = (formData)  => axios.post(`${PY}/register`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const streamUrl = () => `${PY}/stream`
