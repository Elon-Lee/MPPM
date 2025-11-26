/**
 * 初始化数据库 Schema
 */
export function initSchema(db) {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      nickname TEXT,
      avatar_url TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // 内容表
  db.exec(`
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      content_type TEXT DEFAULT 'ARTICLE',
      status TEXT DEFAULT 'DRAFT',
      version INTEGER DEFAULT 1,
      last_sync_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `)

  // 平台表
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT,
      config TEXT,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `)

  // 平台账号表
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      account_name TEXT,
      encrypted_credentials TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (platform_id) REFERENCES platforms(platform_id),
      UNIQUE(user_id, platform_id)
    )
  `)

  // 发布任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS publish_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      publish_url TEXT,
      error_message TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (content_id) REFERENCES contents(local_id),
      FOREIGN KEY (platform_id) REFERENCES platforms(platform_id)
    )
  `)

  // 同步日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      client_version TEXT,
      server_version INTEGER,
      conflict_data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `)

  // 离线队列表
  db.exec(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      request_type TEXT NOT NULL,
      request_url TEXT NOT NULL,
      request_data TEXT,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
    CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
    CREATE INDEX IF NOT EXISTS idx_contents_last_sync_at ON contents(last_sync_at);
    CREATE INDEX IF NOT EXISTS idx_platform_accounts_user_platform ON platform_accounts(user_id, platform_id);
    CREATE INDEX IF NOT EXISTS idx_publish_tasks_user_id ON publish_tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_publish_tasks_status ON publish_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_offline_queue_user_id ON offline_queue(user_id);
    CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
  `)

  console.log('Database schema initialized')
}

