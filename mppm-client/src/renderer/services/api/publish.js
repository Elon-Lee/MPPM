import apiClient from './index'

export const publishTaskAPI = {
  list(params = {}) {
    return apiClient.get('/publish/tasks', { params })
  },
  create(payload) {
    return apiClient.post('/publish/tasks', payload)
  },
  updateStatus(id, payload) {
    return apiClient.put(`/publish/tasks/${id}/status`, payload)
  }
}

