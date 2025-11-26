import apiClient from './index'

export const syncAPI = {
  upload(payload) {
    return apiClient.post('/sync/upload', payload)
  },

  download(payload) {
    return apiClient.post('/sync/download', payload)
  },

  resolveConflict(payload) {
    return apiClient.post('/sync/resolve-conflict', payload)
  }
}

