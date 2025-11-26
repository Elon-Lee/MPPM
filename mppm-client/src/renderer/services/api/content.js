import apiClient from './index'

export const contentAPI = {
  list(params = {}) {
    return apiClient.get('/contents', { params })
  },

  detail(id) {
    return apiClient.get(`/contents/${id}`)
  },

  create(payload) {
    return apiClient.post('/contents', payload)
  },

  update(id, payload) {
    return apiClient.put(`/contents/${id}`, payload)
  },

  remove(id) {
    return apiClient.delete(`/contents/${id}`)
  }
}

