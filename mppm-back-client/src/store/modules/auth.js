import { defineStore } from 'pinia'
import { authAPI } from '@/services/api/auth'
import { tokenService } from '@/services/tokenService'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    initialized: false
  }),

  actions: {
    async login(payload) {
      try {
        const result = await authAPI.login(payload)
        this.user = result.user
        this.isAuthenticated = true
        tokenService.setTokens(result.accessToken, result.refreshToken, result.user)
        ElMessage.success('登录成功')
        return result
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
        throw error
      }
    },

    async logout() {
      try {
        if (tokenService.getRefreshToken()) {
          await authAPI.logout({ refreshToken: tokenService.getRefreshToken() })
        }
      } finally {
        this.reset()
      }
    },

    async restore() {
      const stored = tokenService.getUserInfo()
      if (stored) {
        this.user = stored
        this.isAuthenticated = !!tokenService.getAccessToken()
      }
      this.initialized = true
    },

    reset() {
      tokenService.clear()
      this.user = null
      this.isAuthenticated = false
    }
  }
})

