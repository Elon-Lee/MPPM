import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let mainWindow = null

/**
 * 创建主窗口
 */
export function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    webPreferences: {
      // Dev: out/preload/index.js; Prod: dist-electron/preload/index.js (within asar)
      preload: is.dev
        ? join(app.getAppPath(), 'out/preload/index.js')
        : join(__dirname, '../../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    }
  })

  // 窗口准备显示时
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // 窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 加载页面
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../../../renderer/index.html'))
  }

  return mainWindow
}

/**
 * 获取主窗口
 */
export function getMainWindow() {
  return mainWindow
}

/**
 * 销毁所有窗口
 */
export function destroyAllWindows() {
  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }
}

export const windowManager = {
  createMainWindow,
  getMainWindow,
  destroyAllWindows
}

