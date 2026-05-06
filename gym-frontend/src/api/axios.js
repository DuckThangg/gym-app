import axios from 'axios'

const instance = axios.create({
  withCredentials: true, // Quan trọng — gửi cookie session theo mỗi request
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance