import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { initSchema } from './migrations/initSchema'

let db = null
const DB_PATH = join(app.getPath('userData'), 'mppm.db')

/**
 * 初始化数据库
 */
export async function initDatabase() {
  try {
    // 确保数据目录存在
    const dbDir = app.getPath('userData')
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    // 连接数据库
    db = new Database(DB_PATH)
    
    // 启用外键约束
    db.pragma('foreign_keys = ON')
    
    // 执行初始化脚本
    initSchema(db)
    
    console.log('Database initialized at:', DB_PATH)
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

