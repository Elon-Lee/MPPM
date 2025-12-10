/**
 * IPC 通道定义
 */
export const IPC_CHANNELS = {
  // 数据库操作
  DB_USER_UPSERT: 'db:user:upsert',
  DB_USER_FIND_BY_ID: 'db:user:findById',
  DB_USER_UPDATE_TOKEN: 'db:user:updateToken',
  DB_USER_GET_CURRENT: 'db:user:getCurrent',
  DB_USER_DELETE: 'db:user:delete',
  
  DB_CONTENT_CREATE: 'db:content:create',
  DB_CONTENT_UPDATE: 'db:content:update',
  DB_CONTENT_FIND_BY_LOCAL_ID: 'db:content:findByLocalId',
  DB_CONTENT_FIND_BY_SERVER_ID: 'db:content:findByServerId',
  DB_CONTENT_FIND_BY_USER_ID: 'db:content:findByUserId',
  DB_CONTENT_FIND_DIRTY: 'db:content:findDirty',
  DB_CONTENT_DELETE: 'db:content:delete',
  DB_CONTENT_UPDATE_SYNC_INFO: 'db:content:updateSyncInfo',
  
  // 加密操作
  CRYPTO_ENCRYPT: 'crypto:encrypt',
  CRYPTO_DECRYPT: 'crypto:decrypt',
  CRYPTO_SAVE_KEY: 'crypto:saveKey',
  CRYPTO_GET_KEY: 'crypto:getKey',
  
  // 系统操作
  SYSTEM_GET_VERSION: 'system:getVersion',
  SYSTEM_GET_PLATFORM: 'system:getPlatform',
  SYSTEM_SHOW_NOTIFICATION: 'system:showNotification',
  PLATFORM_OPEN_LOGIN_WINDOW: 'platform:openLoginWindow',
  PLATFORM_LOGIN_SUCCESS: 'platform:loginSuccess',
  
  // 窗口操作
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
}

