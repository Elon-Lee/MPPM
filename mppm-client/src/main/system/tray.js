import { app, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { getMainWindow } from '../window/windowManager'

let tray = null

/**
 * 初始化系统托盘
 */
export function initTray() {
  // 创建托盘图标
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  
  // 如果图标不存在，创建一个空图标
  if (icon.isEmpty()) {
    tray = new Tray(nativeImage.createEmpty())
  } else {
    tray = new Tray(icon)
  }

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        const mainWindow = getMainWindow()
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        const mainWindow = getMainWindow()
        if (mainWindow) {
          mainWindow.hide()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('MPPM Client')
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

