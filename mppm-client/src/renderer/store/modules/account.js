import { defineStore } from 'pinia'
import { platformAPI, platformAccountAPI } from '@/services/api/accounts'
import { ElMessage } from 'element-plus'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    list: [],
    platforms: [],
    loading: false
  }),
  actions: {
    async fetchPlatforms() {
      this.platforms = await platformAPI.list()
    },
    async fetchAccounts(params = {}) {
      this.loading = true
      try {
        this.list = await platformAccountAPI.list(params)
      } catch (error) {
        ElMessage.error(error.message || '加载账号失败')
      } finally {
        this.loading = false
      }
    },
    async createAccount(payload) {
      await platformAccountAPI.create(payload)
      ElMessage.success('账号创建成功')
      await this.fetchAccounts()
    },
    async updateAccount(id, payload) {
      await platformAccountAPI.update(id, payload)
      ElMessage.success('账号更新成功')
      await this.fetchAccounts()
    },
    async deleteAccount(id) {
      await platformAccountAPI.remove(id)
      ElMessage.success('账号已删除')
      await this.fetchAccounts()
    }
  }
})

