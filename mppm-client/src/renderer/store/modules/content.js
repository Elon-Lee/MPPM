import { defineStore } from 'pinia'
import { contentAPI } from '@/services/api/content'
import { ElMessage } from 'element-plus'

export const useContentStore = defineStore('content', {
  state: () => ({
    list: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    keyword: '',
    status: '',
    current: null
  }),

  actions: {
    async fetchList(params = {}) {
      this.loading = true
      try {
        const query = {
          page: params.page || this.page,
          size: params.size || this.size,
          keyword: params.keyword ?? this.keyword,
          status: params.status ?? this.status
        }
        const data = await contentAPI.list(query)
        this.list = data?.data ?? []
        this.total = data?.total ?? 0
        this.page = data?.page ?? query.page
        this.size = data?.size ?? query.size
        this.keyword = query.keyword
        this.status = query.status
      } catch (error) {
        console.error(error)
        ElMessage.error(error.message || '加载内容失败')
      } finally {
        this.loading = false
      }
    },

    async create(payload) {
      const result = await contentAPI.create(payload)
      ElMessage.success('内容创建成功')
      await this.fetchList()
      return result
    },

    async update(id, payload) {
      const result = await contentAPI.update(id, payload)
      ElMessage.success('内容更新成功')
      await this.fetchList()
      return result
    },

    async remove(id) {
      await contentAPI.remove(id)
      ElMessage.success('内容已删除')
      await this.fetchList()
    },

    async fetchDetail(id) {
      this.current = await contentAPI.detail(id)
      return this.current
    },

    resetCurrent() {
      this.current = null
    }
  }
})

