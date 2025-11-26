import apiClient from './index'

export const platformAPI = {
  list() {
    return apiClient.get('/platforms')
  }
}

export const platformAccountAPI = {
  list(params = {}) {
    return apiClient.get('/platform/accounts', { params })
  },
  create(payload) {
    return apiClient.post('/platform/accounts', payload)
  },
  update(id, payload) {
    return apiClient.put(`/platform/accounts/${id}`, payload)
  },
  remove(id) {
    return apiClient.delete(`/platform/accounts/${id}`)
  }
}

