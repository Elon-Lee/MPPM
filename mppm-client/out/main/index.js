"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Database = require("better-sqlite3");
const fs = require("fs");
const crypto = require("crypto");
const keytar = require("keytar");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const keytar__namespace = /* @__PURE__ */ _interopNamespaceDefault(keytar);
let mainWindow = null;
function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return mainWindow;
  }
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: true,
    webPreferences: {
      // Dev: out/preload/index.js; Prod: dist-electron/preload/index.js (within asar)
      preload: utils.is.dev ? path.join(electron.app.getAppPath(), "out/preload/index.js") : path.join(__dirname, "../../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (utils.is.dev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../../renderer/index.html"));
  }
  return mainWindow;
}
function getMainWindow() {
  return mainWindow;
}
function destroyAllWindows() {
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }
}
const windowManager = {
  createMainWindow,
  getMainWindow,
  destroyAllWindows
};
function initSchema(db2) {
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  db2.exec(`
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
  `);
  console.log("Database schema initialized");
}
let db = null;
const DB_PATH = path.join(electron.app.getPath("userData"), "mppm.db");
async function initDatabase() {
  try {
    const dbDir = electron.app.getPath("userData");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("foreign_keys = ON");
    initSchema(db);
    console.log("Database initialized at:", DB_PATH);
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
const IPC_CHANNELS = {
  // 数据库操作
  DB_USER_UPSERT: "db:user:upsert",
  DB_USER_FIND_BY_ID: "db:user:findById",
  DB_USER_UPDATE_TOKEN: "db:user:updateToken",
  DB_USER_GET_CURRENT: "db:user:getCurrent",
  DB_USER_DELETE: "db:user:delete",
  DB_CONTENT_CREATE: "db:content:create",
  DB_CONTENT_UPDATE: "db:content:update",
  DB_CONTENT_FIND_BY_LOCAL_ID: "db:content:findByLocalId",
  DB_CONTENT_FIND_BY_SERVER_ID: "db:content:findByServerId",
  DB_CONTENT_FIND_BY_USER_ID: "db:content:findByUserId",
  DB_CONTENT_FIND_DIRTY: "db:content:findDirty",
  DB_CONTENT_DELETE: "db:content:delete",
  DB_CONTENT_UPDATE_SYNC_INFO: "db:content:updateSyncInfo",
  // 加密操作
  CRYPTO_ENCRYPT: "crypto:encrypt",
  CRYPTO_DECRYPT: "crypto:decrypt",
  CRYPTO_SAVE_KEY: "crypto:saveKey",
  CRYPTO_GET_KEY: "crypto:getKey",
  // 系统操作
  SYSTEM_GET_VERSION: "system:getVersion",
  SYSTEM_GET_PLATFORM: "system:getPlatform",
  SYSTEM_SHOW_NOTIFICATION: "system:showNotification",
  PLATFORM_OPEN_LOGIN_WINDOW: "platform:openLoginWindow"
};
class UserModel {
  /**
   * 创建或更新用户
   */
  static upsert(userData) {
    const db2 = getDatabase();
    const { userId, username, email, nickname, avatarUrl, accessToken, refreshToken, tokenExpiresAt } = userData;
    const stmt = db2.prepare(`
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
    `);
    return stmt.run(userId, username, email, nickname, avatarUrl, accessToken, refreshToken, tokenExpiresAt);
  }
  /**
   * 根据 user_id 查找用户
   */
  static findByUserId(userId) {
    const db2 = getDatabase();
    const stmt = db2.prepare("SELECT * FROM users WHERE user_id = ?");
    return stmt.get(userId);
  }
  /**
   * 更新 Token
   */
  static updateToken(userId, accessToken, refreshToken, tokenExpiresAt) {
    const db2 = getDatabase();
    const stmt = db2.prepare(`
      UPDATE users 
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `);
    return stmt.run(accessToken, refreshToken, tokenExpiresAt, userId);
  }
  /**
   * 删除用户
   */
  static delete(userId) {
    const db2 = getDatabase();
    const stmt = db2.prepare("DELETE FROM users WHERE user_id = ?");
    return stmt.run(userId);
  }
  /**
   * 获取当前登录用户
   */
  static getCurrentUser() {
    const db2 = getDatabase();
    const stmt = db2.prepare("SELECT * FROM users WHERE access_token IS NOT NULL LIMIT 1");
    return stmt.get();
  }
}
class ContentModel {
  /**
   * 创建内容
   */
  static create(contentData) {
    const db2 = getDatabase();
    const { localId, serverId, userId, title, content, contentType, status } = contentData;
    const stmt = db2.prepare(`
      INSERT INTO contents (local_id, server_id, user_id, title, content, content_type, status, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    return stmt.run(localId, serverId, userId, title, content, contentType || "ARTICLE", status || "DRAFT");
  }
  /**
   * 更新内容
   */
  static update(localId, contentData) {
    const db2 = getDatabase();
    const { title, content, status, version } = contentData;
    const stmt = db2.prepare(`
      UPDATE contents 
      SET title = ?, content = ?, status = ?, version = ?, updated_at = strftime('%s', 'now')
      WHERE local_id = ?
    `);
    return stmt.run(title, content, status, version, localId);
  }
  /**
   * 根据 local_id 查找内容
   */
  static findByLocalId(localId) {
    const db2 = getDatabase();
    const stmt = db2.prepare("SELECT * FROM contents WHERE local_id = ?");
    return stmt.get(localId);
  }
  /**
   * 根据 server_id 查找内容
   */
  static findByServerId(serverId) {
    const db2 = getDatabase();
    const stmt = db2.prepare("SELECT * FROM contents WHERE server_id = ?");
    return stmt.get(serverId);
  }
  /**
   * 获取用户的内容列表
   */
  static findByUserId(userId, options = {}) {
    const db2 = getDatabase();
    const { status, limit = 100, offset = 0 } = options;
    let sql = "SELECT * FROM contents WHERE user_id = ?";
    const params = [userId];
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const stmt = db2.prepare(sql);
    return stmt.all(...params);
  }
  /**
   * 查找待同步内容
   */
  static findDirty(userId) {
    const db2 = getDatabase();
    const stmt = db2.prepare(`
      SELECT * FROM contents
      WHERE user_id = ?
      AND (last_sync_at IS NULL OR updated_at > last_sync_at)
    `);
    return stmt.all(userId);
  }
  /**
   * 删除内容
   */
  static delete(localId) {
    const db2 = getDatabase();
    const stmt = db2.prepare("DELETE FROM contents WHERE local_id = ?");
    return stmt.run(localId);
  }
  /**
   * 更新同步信息
   */
  static updateSyncInfo(localId, serverId, version, lastSyncAt) {
    const db2 = getDatabase();
    const stmt = db2.prepare(`
      UPDATE contents 
      SET server_id = ?, version = ?, last_sync_at = ?, updated_at = strftime('%s', 'now')
      WHERE local_id = ?
    `);
    return stmt.run(serverId, version, lastSyncAt, localId);
  }
}
function handleDatabase() {
  electron.ipcMain.handle(IPC_CHANNELS.DB_USER_UPSERT, async (event, userData) => {
    try {
      const result = UserModel.upsert(userData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_USER_FIND_BY_ID, async (event, userId) => {
    try {
      const user = UserModel.findByUserId(userId);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_USER_UPDATE_TOKEN, async (event, userId, accessToken, refreshToken, tokenExpiresAt) => {
    try {
      const result = UserModel.updateToken(userId, accessToken, refreshToken, tokenExpiresAt);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_USER_GET_CURRENT, async () => {
    try {
      const user = UserModel.getCurrentUser();
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_USER_DELETE, async (event, userId) => {
    try {
      const result = UserModel.delete(userId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_CREATE, async (event, contentData) => {
    try {
      const result = ContentModel.create(contentData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_UPDATE, async (event, localId, contentData) => {
    try {
      const result = ContentModel.update(localId, contentData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_LOCAL_ID, async (event, localId) => {
    try {
      const content = ContentModel.findByLocalId(localId);
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_SERVER_ID, async (event, serverId) => {
    try {
      const content = ContentModel.findByServerId(serverId);
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_BY_USER_ID, async (event, userId, options) => {
    try {
      const contents = ContentModel.findByUserId(userId, options);
      return { success: true, data: contents };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_FIND_DIRTY, async (event, userId) => {
    try {
      const contents = ContentModel.findDirty(userId);
      return { success: true, data: contents };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_DELETE, async (event, localId) => {
    try {
      const result = ContentModel.delete(localId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB_CONTENT_UPDATE_SYNC_INFO, async (event, localId, serverId, version, lastSyncAt) => {
    try {
      const result = ContentModel.updateSyncInfo(localId, serverId, version, lastSyncAt);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
const SERVICE_NAME = electron.app.getName();
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 1e5;
class Encryptor {
  /**
   * 从 Keychain 获取或生成密钥
   */
  async getOrCreateKey(keyId) {
    try {
      let key = await keytar__namespace.getPassword(SERVICE_NAME, keyId);
      if (!key) {
        key = crypto.randomBytes(KEY_LENGTH).toString("hex");
        await keytar__namespace.setPassword(SERVICE_NAME, keyId, key);
      }
      return Buffer.from(key, "hex");
    } catch (error) {
      console.error("Failed to get or create key:", error);
      throw error;
    }
  }
  /**
   * 保存密钥到 Keychain
   */
  async saveKey(keyId, key) {
    try {
      await keytar__namespace.setPassword(SERVICE_NAME, keyId, key.toString("hex"));
    } catch (error) {
      console.error("Failed to save key:", error);
      throw error;
    }
  }
  /**
   * 从 Keychain 获取密钥
   */
  async getKey(keyId) {
    try {
      const key = await keytar__namespace.getPassword(SERVICE_NAME, keyId);
      if (!key) {
        throw new Error(`Key not found: ${keyId}`);
      }
      return Buffer.from(key, "hex");
    } catch (error) {
      console.error("Failed to get key:", error);
      throw error;
    }
  }
  /**
   * 加密数据
   */
  async encrypt(data, keyId = "default") {
    try {
      const key = await this.getOrCreateKey(keyId);
      const iv = crypto.randomBytes(IV_LENGTH);
      const salt = crypto.randomBytes(SALT_LENGTH);
      const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
      const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(data, "utf8"),
        cipher.final()
      ]);
      const tag = cipher.getAuthTag();
      const result = Buffer.concat([salt, iv, tag, encrypted]);
      return result.toString("base64");
    } catch (error) {
      console.error("Encryption failed:", error);
      throw error;
    }
  }
  /**
   * 解密数据
   */
  async decrypt(encryptedData, keyId = "default") {
    try {
      const key = await this.getKey(keyId);
      const data = Buffer.from(encryptedData, "base64");
      const salt = data.subarray(0, SALT_LENGTH);
      const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
      const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      return decrypted.toString("utf8");
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  }
}
const encryptor = new Encryptor();
function handleCrypto() {
  electron.ipcMain.handle(IPC_CHANNELS.CRYPTO_ENCRYPT, async (event, data, keyId) => {
    try {
      const encrypted = await encryptor.encrypt(data, keyId);
      return { success: true, data: encrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.CRYPTO_DECRYPT, async (event, encryptedData, keyId) => {
    try {
      const decrypted = await encryptor.decrypt(encryptedData, keyId);
      return { success: true, data: decrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.CRYPTO_SAVE_KEY, async (event, keyId, key) => {
    try {
      await encryptor.saveKey(keyId, key);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.CRYPTO_GET_KEY, async (event, keyId) => {
    try {
      const key = await encryptor.getKey(keyId);
      return { success: true, data: key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
function handleSystem() {
  electron.ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, () => {
    return { success: true, data: electron.app.getVersion() };
  });
  electron.ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, () => {
    return { success: true, data: process.platform };
  });
  electron.ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, (event, { title, body, icon }) => {
    if (electron.Notification.isSupported()) {
      const notification = new electron.Notification({
        title,
        body,
        icon
      });
      notification.show();
      return { success: true };
    }
    return { success: false, error: "Notifications not supported" };
  });
}
const windows = /* @__PURE__ */ new Map();
function openLoginWindow({ url, partitionKey, successPatterns = [], eventSender, platformId }) {
  const key = partitionKey || `platform-login-${Date.now()}`;
  const ses = electron.session.fromPartition(`persist:${key}`);
  const initialUrl = url;
  let hasNavigatedAway = false;
  const win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      session: ses,
      // Dev: out/preload/index.js; Prod: dist-electron/preload/index.js
      preload: utils.is.dev ? path.join(electron.app.getAppPath(), "out/preload/index.js") : path.join(__dirname, "../../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  windows.set(key, win);
  win.on("closed", () => {
    windows.delete(key);
  });
  const isSuccess = (targetUrl) => {
    if (!hasNavigatedAway) {
      return false;
    }
    if (!targetUrl || targetUrl === initialUrl) {
      return false;
    }
    if (successPatterns && successPatterns.length > 0) {
      return successPatterns.some((p) => targetUrl.includes(p));
    }
    return !targetUrl.includes("passport.weibo.com");
  };
  win.webContents.on("did-navigate", (_event, targetUrl) => {
    if (targetUrl && targetUrl !== initialUrl) {
      hasNavigatedAway = true;
    }
    if (isSuccess(targetUrl)) {
      if (eventSender) {
        eventSender.send("platform:loginSuccess", { platformId, url: targetUrl });
      }
      if (!win.isDestroyed()) {
        win.close();
      }
    }
  });
  win.loadURL(url);
  return { key };
}
function handlePlatformLogin() {
  electron.ipcMain.handle(IPC_CHANNELS.PLATFORM_OPEN_LOGIN_WINDOW, async (event, payload) => {
    const { url, partitionKey, successPatterns, platformId } = payload || {};
    if (!url) {
      return { success: false, error: "login url is required" };
    }
    try {
      const result = openLoginWindow({
        url,
        partitionKey,
        successPatterns,
        platformId,
        eventSender: event.sender
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
function initIpcHandlers() {
  handleDatabase();
  handleCrypto();
  handleSystem();
  handlePlatformLogin();
  console.log("IPC handlers initialized");
}
let tray = null;
function initTray() {
  const iconPath = path.join(__dirname, "../../assets/tray-icon.png");
  const icon = electron.nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    tray = new electron.Tray(electron.nativeImage.createEmpty());
  } else {
    tray = new electron.Tray(icon);
  }
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        const mainWindow2 = getMainWindow();
        if (mainWindow2) {
          mainWindow2.show();
          mainWindow2.focus();
        }
      }
    },
    {
      label: "隐藏窗口",
      click: () => {
        const mainWindow2 = getMainWindow();
        if (mainWindow2) {
          mainWindow2.hide();
        }
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("MPPM Client");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    const mainWindow2 = getMainWindow();
    if (mainWindow2) {
      if (mainWindow2.isVisible()) {
        mainWindow2.hide();
      } else {
        mainWindow2.show();
        mainWindow2.focus();
      }
    }
  });
}
function initAutoUpdater() {
  console.log("Auto updater initialized (placeholder)");
}
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
async function initializeApp() {
  try {
    await initDatabase();
    initIpcHandlers();
    initTray();
    if (!electron.app.isPackaged) {
      initAutoUpdater();
    }
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
}
function createWindow() {
  windowManager.createMainWindow();
}
electron.app.whenReady().then(() => {
  initializeApp();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", () => {
  windowManager.destroyAllWindows();
});
