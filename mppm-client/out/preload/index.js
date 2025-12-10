"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  // 数据库操作
  DB_USER_UPSERT: "db:user:upsert",
  DB_USER_FIND_BY_ID: "db:user:findById",
  DB_USER_UPDATE_TOKEN: "db:user:updateToken",
  DB_USER_GET_CURRENT: "db:user:getCurrent",
  DB_USER_DELETE: "db:user:delete",
  DB_CONTENT_CREATE: "db:content:create",
  DB_CONTENT_UPDATE: "db:content:update",
  DB_CONTENT_FIND_BY_LOCAL_ID: "db:content:findByLocalId",
  DB_CONTENT_FIND_BY_SERVER_ID: "db:content:findByServerId",
  DB_CONTENT_FIND_BY_USER_ID: "db:content:findByUserId",
  DB_CONTENT_DELETE: "db:content:delete",
  DB_CONTENT_UPDATE_SYNC_INFO: "db:content:updateSyncInfo",
  // 加密操作
  CRYPTO_ENCRYPT: "crypto:encrypt",
  CRYPTO_DECRYPT: "crypto:decrypt",
  CRYPTO_SAVE_KEY: "crypto:saveKey",
  CRYPTO_GET_KEY: "crypto:getKey",
  // 系统操作
  SYSTEM_GET_VERSION: "system:getVersion",
  SYSTEM_GET_PLATFORM: "system:getPlatform",
  SYSTEM_SHOW_NOTIFICATION: "system:showNotification",
  PLATFORM_OPEN_LOGIN_WINDOW: "platform:openLoginWindow",
  PLATFORM_LOGIN_SUCCESS: "platform:loginSuccess"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // 数据库操作
  db: {
    user: {
      upsert: (userData) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_USER_UPSERT, userData),
      findById: (userId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_USER_FIND_BY_ID, userId),
      updateToken: (userId, accessToken, refreshToken, tokenExpiresAt) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_USER_UPDATE_TOKEN, userId, accessToken, refreshToken, tokenExpiresAt),
      getCurrent: () => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_USER_GET_CURRENT),
      delete: (userId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_USER_DELETE, userId)
    },
    content: {
      create: (contentData) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_CREATE, contentData),
      update: (localId, contentData) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_UPDATE, localId, contentData),
      findByLocalId: (localId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_LOCAL_ID, localId),
      findByServerId: (serverId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_SERVER_ID, serverId),
      findByUserId: (userId, options) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_FIND_BY_USER_ID, userId, options),
      delete: (localId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_DELETE, localId),
      updateSyncInfo: (localId, serverId, version, lastSyncAt) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB_CONTENT_UPDATE_SYNC_INFO, localId, serverId, version, lastSyncAt)
    }
  },
  // 加密操作
  crypto: {
    encrypt: (data, keyId) => electron.ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_ENCRYPT, data, keyId),
    decrypt: (encryptedData, keyId) => electron.ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_DECRYPT, encryptedData, keyId),
    saveKey: (keyId, key) => electron.ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_SAVE_KEY, keyId, key),
    getKey: (keyId) => electron.ipcRenderer.invoke(IPC_CHANNELS.CRYPTO_GET_KEY, keyId)
  },
  // 系统操作
  system: {
    getVersion: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_VERSION),
    getPlatform: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PLATFORM),
    showNotification: (options) => electron.ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, options)
  },
  platform: {
    openLoginWindow: (payload) => electron.ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_OPEN_LOGIN_WINDOW, payload),
    onLoginSuccess: (callback) => {
      const listener = (_event, data) => callback?.(data);
      electron.ipcRenderer.on(IPC_CHANNELS.PLATFORM_LOGIN_SUCCESS, listener);
      return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.PLATFORM_LOGIN_SUCCESS, listener);
    }
  }
});
