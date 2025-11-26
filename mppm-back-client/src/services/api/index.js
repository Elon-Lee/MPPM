import axios from 'axios'
import { tokenService } from '@/services/tokenService'
import router from '@/router'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

instance.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data?.code && data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data?.data ?? data
  },
  async (error) => {
    if (error.response?.status === 401) {
      tokenService.clear()
      if (router.currentRoute.value.path !== '/login') {
        router.replace({ path: '/login' })
      }
    }
    return Promise.reject(error)
  }
)

export default instance

