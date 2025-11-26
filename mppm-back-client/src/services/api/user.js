import api from './index'

export const userAPI = {
  list(params) {
    return api.get('/v1/users', { params })
  },
  create(payload) {
    return api.post('/v1/users', payload)
  },
  update(id, payload) {
    return api.put(`/v1/users/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/v1/users/${id}`)
  },
  resetPassword(id, payload = {}) {
    return api.post(`/v1/users/${id}/reset-password`, payload)
  },
  roles() {
    return api.get('/v1/users/roles')
  }
}

