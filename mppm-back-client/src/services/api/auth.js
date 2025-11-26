import api from './index'

export const authAPI = {
  login(payload) {
    return api.post('/v1/auth/login', payload)
  },
  refresh(payload) {
    return api.post('/v1/auth/refresh', payload)
  },
  logout(payload) {
    return api.post('/v1/auth/logout', payload)
  }
}

