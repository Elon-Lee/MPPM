import { defineStore } from 'pinia'
import { publishTaskAPI } from '@/services/api/publish'
import { ElMessage } from 'element-plus'

export const usePublishStore = defineStore('publish', {
  state: () => ({
    tasks: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false
  }),
  actions: {
    async fetchTasks(params = {}) {
      this.loading = true
      try {
        const query = {
          page: params.page ?? this.page,
          size: params.size ?? this.size,
          status: params.status,
          platformId: params.platformId
        }
        const data = await publishTaskAPI.list(query)
        this.tasks = data?.data ?? []
        this.total = data?.total ?? 0
        this.page = data?.page ?? query.page
        this.size = data?.size ?? query.size
      } catch (error) {
        ElMessage.error(error.message || '加载任务失败')
      } finally {
        this.loading = false
      }
    },
    async createTask(payload) {
      await publishTaskAPI.create(payload)
      ElMessage.success('已创建发布任务')
      await this.fetchTasks()
    },
    async updateStatus(id, payload) {
      await publishTaskAPI.updateStatus(id, payload)
      await this.fetchTasks()
    }
  }
})

