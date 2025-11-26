import { defineStore } from 'pinia'
import { userAPI } from '@/services/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    list: [],
    loading: false,
    total: 0,
    page: 1,
    size: 10,
    keyword: ''
  }),

  actions: {
    async fetchUsers(params = {}) {
      this.loading = true
      try {
        const query = {
          page: params.page ?? this.page,
          size: params.size ?? this.size,
          keyword: params.keyword ?? this.keyword
        }
        const data = await userAPI.list(query)
        this.list = data?.data ?? []
        this.total = data?.total ?? 0
        this.page = data?.page ?? query.page
        this.size = data?.size ?? query.size
        this.keyword = query.keyword
      } catch (error) {
        ElMessage.error(error.message || '加载用户失败')
      } finally {
        this.loading = false
      }
    },

    async createUser(payload) {
      await userAPI.create(payload)
      ElMessage.success('用户创建成功')
      await this.fetchUsers()
    },

    async updateUser(id, payload) {
      await userAPI.update(id, payload)
      ElMessage.success('用户更新成功')
      await this.fetchUsers()
    },

    async deleteUser(id) {
      await userAPI.remove(id)
      ElMessage.success('用户已删除')
      await this.fetchUsers()
    },

    async resetPassword(id) {
      const result = await userAPI.resetPassword(id)
      if (typeof result === 'string') {
        ElMessage.success(`已重置密码：${result}`)
      } else if (result?.newPassword) {
        ElMessage.success(`已重置密码：${result.newPassword}`)
      } else {
        ElMessage.success('已重置密码')
      }
    }
  }
})

