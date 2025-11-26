import { app, BrowserWindow } from 'electron'
import { windowManager } from './window/windowManager'
import { initDatabase } from './database/sqlite'
import { initIpcHandlers } from './ipc/handlers'
import { initTray } from './system/tray'
import { initAutoUpdater } from './system/autoUpdater'

// 禁用安全警告（开发环境）
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 初始化应用
async function initializeApp() {
  try {
    // 初始化数据库
    await initDatabase()
    
    // 初始化 IPC 处理器
    initIpcHandlers()
    
    // 初始化系统托盘
    initTray()
    
    // 初始化自动更新（生产环境）
    if (!app.isPackaged) {
      initAutoUpdater()
    }
    
    console.log('Application initialized successfully')
  } catch (error) {
    console.error('Failed to initialize application:', error)
  }
}

// 创建主窗口
function createWindow() {
  windowManager.createMainWindow()
}

// 应用准备就绪
app.whenReady().then(() => {
  initializeApp()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前清理
app.on('before-quit', () => {
  // 清理资源
  windowManager.destroyAllWindows()
})

