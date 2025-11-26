import axios from 'axios'

// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从本地存储获取 Token
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 统一处理响应格式
    if (response.data && response.data.code !== undefined) {
      if (response.data.code === 200) {
        return response.data.data
      } else {
        return Promise.reject(new Error(response.data.message || '请求失败'))
      }
    }
    return response.data
  },
  async (error) => {
    // Token 过期，尝试刷新
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          // TODO: 调用刷新 Token 接口
          // const newToken = await refreshAccessToken(refreshToken)
          // localStorage.setItem('accessToken', newToken)
          // 重试原请求
          // return apiClient.request(error.config)
        } catch (refreshError) {
          // 刷新失败，跳转到登录页
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.hash = '/login'
        }
      } else {
        window.location.hash = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

