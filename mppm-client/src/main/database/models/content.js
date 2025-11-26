import { getDatabase } from '../sqlite'

/**
 * 内容模型
 */
export class ContentModel {
  /**
   * 创建内容
   */
  static create(contentData) {
    const db = getDatabase()
    const { localId, serverId, userId, title, content, contentType, status } = contentData

    const stmt = db.prepare(`
      INSERT INTO contents (local_id, server_id, user_id, title, content, content_type, status, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `)

    return stmt.run(localId, serverId, userId, title, content, contentType || 'ARTICLE', status || 'DRAFT')
  }

  /**
   * 更新内容
   */
  static update(localId, contentData) {
    const db = getDatabase()
    const { title, content, status, version } = contentData

    const stmt = db.prepare(`
      UPDATE contents 
      SET title = ?, content = ?, status = ?, version = ?, updated_at = strftime('%s', 'now')
      WHERE local_id = ?
    `)

    return stmt.run(title, content, status, version, localId)
  }

  /**
   * 根据 local_id 查找内容
   */
  static findByLocalId(localId) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM contents WHERE local_id = ?')
    return stmt.get(localId)
  }

  /**
   * 根据 server_id 查找内容
   */
  static findByServerId(serverId) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM contents WHERE server_id = ?')
    return stmt.get(serverId)
  }

  /**
   * 获取用户的内容列表
   */
  static findByUserId(userId, options = {}) {
    const db = getDatabase()
    const { status, limit = 100, offset = 0 } = options

    let sql = 'SELECT * FROM contents WHERE user_id = ?'
    const params = [userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const stmt = db.prepare(sql)
    return stmt.all(...params)
  }

  /**
   * 删除内容
   */
  static delete(localId) {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM contents WHERE local_id = ?')
    return stmt.run(localId)
  }

  /**
   * 更新同步信息
   */
  static updateSyncInfo(localId, serverId, version, lastSyncAt) {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE contents 
      SET server_id = ?, version = ?, last_sync_at = ?, updated_at = strftime('%s', 'now')
      WHERE local_id = ?
    `)
    return stmt.run(serverId, version, lastSyncAt, localId)
  }
}

