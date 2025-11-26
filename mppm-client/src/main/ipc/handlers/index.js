import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { handleDatabase } from './database'
import { handleCrypto } from './crypto'
import { handleSystem } from './system'

/**
 * 初始化所有 IPC 处理器
 */
export function initIpcHandlers() {
  // 注册数据库处理器
  handleDatabase()
  
  // 注册加密处理器
  handleCrypto()
  
  // 注册系统处理器
  handleSystem()
  
  console.log('IPC handlers initialized')
}

