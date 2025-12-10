import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { openLoginWindow } from '../../window/loginWindow'

export function handlePlatformLogin() {
  ipcMain.handle(IPC_CHANNELS.PLATFORM_OPEN_LOGIN_WINDOW, async (event, payload) => {
    const { url, partitionKey, successPatterns, platformId } = payload || {}
    if (!url) {
      return { success: false, error: 'login url is required' }
    }
    try {
      const result = openLoginWindow({
        url,
        partitionKey,
        successPatterns,
        platformId,
        eventSender: event.sender
      })
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

