import { app, BrowserWindow, session } from 'electron'
import { join, resolve } from 'path'
import { is } from '@electron-toolkit/utils'

const windows = new Map()

export function openLoginWindow({ url, partitionKey, successPatterns = [], eventSender, platformId }) {
  const key = partitionKey || `platform-login-${Date.now()}`
  const ses = session.fromPartition(`persist:${key}`)
  const cachePath = resolve(app.getPath('userData'), 'Partitions', `persist:${key}`)
  const initialUrl = url
  let hasNavigatedAway = false

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      session: ses,
      // Dev: out/preload/index.js; Prod: dist-electron/preload/index.js
      preload: is.dev
        ? join(app.getAppPath(), 'out/preload/index.js')
        : join(__dirname, '../../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  windows.set(key, win)
  win.on('closed', () => {
    windows.delete(key)
  })

  console.log(
    `[loginWindow] open login window`,
    JSON.stringify({
      platformId,
      partition: `persist:${key}`,
      cachePath
    })
  )

  const isSuccess = (targetUrl) => {
    if (!hasNavigatedAway) {
      return false
    }
    if (!targetUrl || targetUrl === initialUrl) {
      return false
    }
    if (successPatterns && successPatterns.length > 0) {
      return successPatterns.some((p) => targetUrl.includes(p))
    }
    // 默认：跳转到非登录域名即认为成功
    return !targetUrl.includes('passport')
  }

  win.webContents.on('did-navigate', (_event, targetUrl) => {
    if (targetUrl && targetUrl !== initialUrl) {
      hasNavigatedAway = true
    }
    if (isSuccess(targetUrl)) {
      if (eventSender) {
        eventSender.send('platform:loginSuccess', { platformId, url: targetUrl })
      }
      // 保留窗口，不自动关闭，方便用户继续操作或确认
      console.log(
        `[loginWindow] login success detected`,
        JSON.stringify({
          platformId,
          url: targetUrl,
          partition: `persist:${key}`,
          cachePath
        })
      )
    }
  })

  win.loadURL(url)
  return { key }
}

