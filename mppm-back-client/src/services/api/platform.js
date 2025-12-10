import api from './index'

export const platformAPI = {
  list() {
    return api.get('/v1/platforms')
  },
  create(payload) {
    return api.post('/v1/platforms', payload)
  },
  update(id, payload) {
    return api.put(`/v1/platforms/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/v1/platforms/${id}`)
  }
}

