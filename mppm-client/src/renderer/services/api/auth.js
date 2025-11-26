import apiClient from './index'

/**
 * 认证相关 API
 */
export const authAPI = {
  /**
   * 登录
   */
  login: (username, password) => {
    return apiClient.post('/auth/login', { username, password })
  },

  /**
   * 刷新 Token
   */
  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh', { refreshToken })
  },

  /**
   * 登出
   */
  logout: (refreshToken) => {
    return apiClient.post('/auth/logout', { refreshToken })
  }
}

