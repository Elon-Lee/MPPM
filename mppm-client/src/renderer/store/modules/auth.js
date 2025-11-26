import { defineStore } from 'pinia'
import { authAPI } from '@/services/api/auth'
import { ElMessage } from 'element-plus'
import { tokenService } from '@/services/auth/tokenService'
import { userRepository } from '@/services/storage/database'
import { syncEngine } from '@/services/sync/syncEngine'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: tokenService.getAccessToken(),
    refreshToken: tokenService.getRefreshToken(),
    isAuthenticated: false,
    _tokenUnsubscribe: null
  }),

  getters: {
    currentUser: (state) => state.user,
    hasToken: (state) => !!state.accessToken
  },

  actions: {
    initTokenWatcher() {
      if (this._tokenUnsubscribe || typeof window === 'undefined') {
        return
      }
      this._tokenUnsubscribe = tokenService.subscribe(({ accessToken, refreshToken }) => {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        if (!accessToken) {
          this.isAuthenticated = false
        }
      })
    },

    /**
     * 登录
     */
    async login(username, password) {
      this.initTokenWatcher()

      try {
        const response = await authAPI.login(username, password)
        
        this.accessToken = response.accessToken
        this.refreshToken = response.refreshToken
        this.user = response.user
        this.isAuthenticated = true

        // 保存到本地存储
        tokenService.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        })
        
        // 保存到本地数据库
        if (userRepository.isAvailable()) {
          await userRepository.upsert({
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
        syncEngine.syncContents().catch((err) => console.error('Initial sync failed', err))
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
      this.initTokenWatcher()

      const currentUserId = this.user?.id
      const refreshToken = this.refreshToken

      try {
        if (refreshToken) {
          await authAPI.logout(refreshToken)
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
        tokenService.clearTokens()

        // 清除本地数据库
        if (userRepository.isAvailable() && currentUserId) {
          await userRepository.delete(currentUserId.toString())
        }
      }
    },

    /**
     * 刷新 Token
     */
    async refreshAccessToken() {
      this.initTokenWatcher()

      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const response = await authAPI.refreshToken(this.refreshToken)
        this.accessToken = response.accessToken
        this.refreshToken = response.refreshToken ?? this.refreshToken
        tokenService.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken ?? this.refreshToken
        })

        // 更新本地数据库
        if (userRepository.isAvailable() && this.user) {
          await userRepository.updateToken(
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
      this.initTokenWatcher()

      if (!userRepository.isAvailable()) return

      try {
        const userData = await userRepository.getCurrent()
        if (userData) {
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

          tokenService.setTokens({
            accessToken: userData.access_token,
            refreshToken: userData.refresh_token
          })

          // 检查 Token 是否过期
          if (userData.token_expires_at && userData.token_expires_at < Date.now()) {
            // Token 已过期，尝试刷新
            await this.refreshAccessToken()
          }
          syncEngine.syncContents().catch((err) => console.error('Sync failed', err))
        }
      } catch (error) {
        console.error('Failed to restore user:', error)
      }
    }
  }
})

