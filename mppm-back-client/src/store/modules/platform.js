import { defineStore } from 'pinia'
import { platformAPI } from '@/services/api/platform'
import { ElMessage } from 'element-plus'

export const usePlatformStore = defineStore('platform', {
  state: () => ({
    list: [],
    loading: false
  }),
  actions: {
    async fetchPlatforms() {
      this.loading = true
      try {
        this.list = await platformAPI.list()
      } catch (error) {
        ElMessage.error(error.message || '加载平台列表失败')
      } finally {
        this.loading = false
      }
    },
    async createPlatform(payload) {
      await platformAPI.create(payload)
      ElMessage.success('平台创建成功')
      await this.fetchPlatforms()
    },
    async updatePlatform(id, payload) {
      await platformAPI.update(id, payload)
      ElMessage.success('平台更新成功')
      await this.fetchPlatforms()
    },
    async deletePlatform(id) {
      await platformAPI.remove(id)
      ElMessage.success('平台已删除')
      await this.fetchPlatforms()
    }
  }
})

