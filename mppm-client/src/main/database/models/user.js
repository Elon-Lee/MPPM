import { getDatabase } from '../sqlite'

/**
 * 用户模型
 */
export class UserModel {
  /**
   * 创建或更新用户
   */
  static upsert(userData) {
    const db = getDatabase()
    const { userId, username, email, nickname, avatarUrl, accessToken, refreshToken, tokenExpiresAt } = userData

    const stmt = db.prepare(`
      INSERT INTO users (user_id, username, email, nickname, avatar_url, access_token, refresh_token, token_expires_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        email = excluded.email,
        nickname = excluded.nickname,
        avatar_url = excluded.avatar_url,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        updated_at = strftime('%s', 'now')
    `)

    return stmt.run(userId, username, email, nickname, avatarUrl, accessToken, refreshToken, tokenExpiresAt)
  }

  /**
   * 根据 user_id 查找用户
   */
  static findByUserId(userId) {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?')
    return stmt.get(userId)
  }

  /**
   * 更新 Token
   */
  static updateToken(userId, accessToken, refreshToken, tokenExpiresAt) {
    const db = getDatabase()
    const stmt = db.prepare(`
      UPDATE users 
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `)
    return stmt.run(accessToken, refreshToken, tokenExpiresAt, userId)
  }

  /**
   * 删除用户
   */
  static delete(userId) {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM users WHERE user_id = ?')
    return stmt.run(userId)
  }

  /**
   * 获取当前登录用户
   */
  static getCurrentUser() {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM users WHERE access_token IS NOT NULL LIMIT 1')
    return stmt.get()
  }
}

