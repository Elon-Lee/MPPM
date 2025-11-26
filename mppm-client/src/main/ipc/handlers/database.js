import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { UserModel } from '../../database/models/user'
import { ContentModel } from '../../database/models/content'

/**
 * 数据库操作 IPC 处理器
 */
export function handleDatabase() {
  // 用户相关
  ipcMain.handle(IPC_CHANNELS.DB_USER_UPSERT, async (event, userData) => {
    try {
      const result = UserModel.upsert(userData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_USER_FIND_BY_ID, async (event, userId) => {
    try {
      const user = UserModel.findByUserId(userId)
      return { success: true, data: user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_USER_UPDATE_TOKEN, async (event, userId, accessToken, refreshToken, tokenExpiresAt) => {
    try {
      const result = UserModel.updateToken(userId, accessToken, refreshToken, tokenExpiresAt)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_USER_GET_CURRENT, async () => {
    try {
      const user = UserModel.getCurrentUser()
      return { success: true, data: user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_USER_DELETE, async (event, userId) => {
    try {
      const result = UserModel.delete(userId)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 内容相关
  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_CREATE, async (event, contentData) => {
    try {
      const result = ContentModel.create(contentData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_UPDATE, async (event, localId, contentData) => {
    try {
      const result = ContentModel.update(localId, contentData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_LOCAL_ID, async (event, localId) => {
    try {
      const content = ContentModel.findByLocalId(localId)
      return { success: true, data: content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_SERVER_ID, async (event, serverId) => {
    try {
      const content = ContentModel.findByServerId(serverId)
      return { success: true, data: content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_USER_ID, async (event, userId, options) => {
    try {
      const contents = ContentModel.findByUserId(userId, options)
      return { success: true, data: contents }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_DELETE, async (event, localId) => {
    try {
      const result = ContentModel.delete(localId)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB_CONTENT_UPDATE_SYNC_INFO, async (event, localId, serverId, version, lastSyncAt) => {
    try {
      const result = ContentModel.updateSyncInfo(localId, serverId, version, lastSyncAt)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

