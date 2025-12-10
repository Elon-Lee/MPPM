import axios from 'axios'
import { tokenService } from '@/services/auth/tokenService'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// 创建 Axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 刷新 Token 的裸客户端，避免拦截器递归
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let refreshQueue = []

const enqueueRequest = () =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject })
  })

const flushQueue = (error, token) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  refreshQueue = []
}

const redirectToLogin = () => {
  tokenService.clearTokens()
  if (typeof window !== 'undefined') {
    window.location.hash = '/login'
  }
}

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从本地存储获取 Token
    const token = tokenService.getAccessToken()
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
    const { response, config } = error

    if (response?.status === 401 && !config?._retry) {
      const refreshToken = tokenService.getRefreshToken()
      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      config._retry = true

      if (isRefreshing) {
        try {
          const newToken = await enqueueRequest()
          config.headers.Authorization = `Bearer ${newToken}`
          return apiClient(config)
        } catch (queueError) {
          return Promise.reject(queueError)
        }
      }

      isRefreshing = true

      return new Promise((resolve, reject) => {
        refreshClient
          .post('/auth/refresh', { refreshToken })
          .then((refreshResponse) => {
            const payload = refreshResponse.data?.data ?? refreshResponse.data
            if (!payload?.accessToken) {
              throw new Error('刷新接口返回异常')
            }

            tokenService.setTokens({
              accessToken: payload.accessToken,
              refreshToken: payload.refreshToken ?? refreshToken
            })

            flushQueue(null, payload.accessToken)
            config.headers.Authorization = `Bearer ${payload.accessToken}`
            resolve(apiClient(config))
          })
          .catch((refreshError) => {
            flushQueue(refreshError, null)
            redirectToLogin()
            reject(refreshError)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    if (response?.status === 403) {
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

export default apiClient

