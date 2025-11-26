import { defineStore } from 'pinia'
import { authAPI } from '@/services/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    hasToken: (state) => !!state.accessToken
  },

  actions: {
    /**
     * 登录
     */
    async login(username, password) {
      try {
        const response = await authAPI.login(username, password)
        
        this.accessToken = response.accessToken
        this.refreshToken = response.refreshToken
        this.user = response.user
        this.isAuthenticated = true

        // 保存到本地存储
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        
        // 保存到本地数据库
        if (window.electronAPI) {
          await window.electronAPI.db.user.upsert({
            userId: response.user.id.toString(),
            username: response.user.username,
            email: response.user.email,
            nickname: response.user.nickname,
            avatarUrl: response.user.avatarUrl,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            tokenExpiresAt: Date.now() + (response.expiresIn * 1000)
          })
        }

        ElMessage.success('登录成功')
        return true
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
        throw error
      }
    },

    /**
     * 登出
     */
    async logout() {
      try {
        if (this.accessToken) {
          await authAPI.logout()
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // 清除状态
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        this.isAuthenticated = false

        // 清除本地存储
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        // 清除本地数据库
        if (window.electronAPI && this.user) {
          await window.electronAPI.db.user.delete(this.user.id.toString())
        }
      }
    },

    /**
     * 刷新 Token
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const response = await authAPI.refreshToken(this.refreshToken)
        this.accessToken = response.accessToken
        localStorage.setItem('accessToken', response.accessToken)

        // 更新本地数据库
        if (window.electronAPI && this.user) {
          await window.electronAPI.db.user.updateToken(
            this.user.id.toString(),
            response.accessToken,
            this.refreshToken,
            Date.now() + (response.expiresIn * 1000)
          )
        }

        return response.accessToken
      } catch (error) {
        // 刷新失败，清除认证信息
        await this.logout()
        throw error
      }
    },

    /**
     * 从本地数据库恢复用户信息
     */
    async restoreUser() {
      if (!window.electronAPI) return

      try {
        const result = await window.electronAPI.db.user.getCurrent()
        if (result.success && result.data) {
          const userData = result.data
          this.user = {
            id: userData.user_id,
            username: userData.username,
            email: userData.email,
            nickname: userData.nickname,
            avatarUrl: userData.avatar_url
          }
          this.accessToken = userData.access_token
          this.refreshToken = userData.refresh_token
          this.isAuthenticated = true

          // 检查 Token 是否过期
          if (userData.token_expires_at && userData.token_expires_at < Date.now()) {
            // Token 已过期，尝试刷新
            await this.refreshAccessToken()
          }
        }
      } catch (error) {
        console.error('Failed to restore user:', error)
      }
    }
  }
})

