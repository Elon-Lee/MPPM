import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../main/ipc/channels'

/**
 * 暴露安全的 API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  db: {
    user: {
      upsert: (userData) => ipcRenderer.invoke(IPC_CHANNELS.DB_USER_UPSERT, userData),
      findById: (userId) => ipcRenderer.invoke(IPC_CHANNELS.DB_USER_FIND_BY_ID, userId),
      updateToken: (userId, accessToken, refreshToken, tokenExpiresAt) =>
        ipcRenderer.invoke(IPC_CHANNELS.DB_USER_UPDATE_TOKEN, userId, accessToken, refreshToken, tokenExpiresAt),
      getCurrent: () => ipcRenderer.invoke(IPC_CHANNELS.DB_USER_GET_CURRENT),
      delete: (userId) => ipcRenderer.invoke(IPC_CHANNELS.DB_USER_DELETE, userId)
    },
    content: {
      create: (contentData) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_CREATE, contentData),
      update: (localId, contentData) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_UPDATE, localId, contentData),
      findByLocalId: (localId) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_LOCAL_ID, localId),
      findByServerId: (serverId) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_SERVER_ID, serverId),
      findByUserId: (userId, options) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_USER_ID, userId, options),
      delete: (localId) => ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_DELETE, localId),
      updateSyncInfo: (localId, serverId, version, lastSyncAt) =>
        ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_UPDATE_SYNC_INFO, localId, serverId, version, lastSyncAt)
    }
  },

  // 加密操作
  crypto: {
    encrypt: (data, keyId) => ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_ENCRYPT, data, keyId),
    decrypt: (encryptedData, keyId) => ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_DECRYPT, encryptedData, keyId),
    saveKey: (keyId, key) => ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_SAVE_KEY, keyId, key),
    getKey: (keyId) => ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_GET_KEY, keyId)
  },

  // 系统操作
  system: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION),
    getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PLATFORM),
    showNotification: (options) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, options)
  }
})

