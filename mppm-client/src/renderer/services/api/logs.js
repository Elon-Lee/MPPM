import apiClient from './index'

export const logAPI = {
  submit(payload) {
    return apiClient.post('/logs', payload)
  }
}

