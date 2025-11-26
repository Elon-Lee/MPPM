import { ipcMain, app, Notification } from 'electron'
import { IPC_CHANNELS } from '../channels'

/**
 * 系统操作 IPC 处理器
 */
export function handleSystem() {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, () => {
    return { success: true, data: app.getVersion() }
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, () => {
    return { success: true, data: process.platform }
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, (event, { title, body, icon }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon
      })
      notification.show()
      return { success: true }
    }
    return { success: false, error: 'Notifications not supported' }
  })
}

