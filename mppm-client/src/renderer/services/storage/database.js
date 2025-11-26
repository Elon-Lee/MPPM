const hasElectronAPI = () =>
  typeof window !== 'undefined' && !!window.electronAPI

const getElectronAPI = () => {
  if (!hasElectronAPI()) {
    throw new Error('Electron API is not available')
  }
  return window.electronAPI
}

const invoke = async (fn, ...args) => {
  if (typeof fn !== 'function') {
    throw new Error('IPC handler not found')
  }
  const result = await fn(...args)
  if (!result) {
    throw new Error('Empty IPC response')
  }
  if (!result.success) {
    throw new Error(result.error || 'IPC call failed')
  }
  return result.data
}

export const userRepository = {
  isAvailable: () => hasElectronAPI() && !!window.electronAPI?.db?.user,

  async upsert(user) {
    return invoke(getElectronAPI().db.user.upsert, user)
  },

  async getCurrent() {
    return invoke(getElectronAPI().db.user.getCurrent)
  },

  async updateToken(userId, accessToken, refreshToken, tokenExpiresAt) {
    return invoke(
      getElectronAPI().db.user.updateToken,
      userId,
      accessToken,
      refreshToken,
      tokenExpiresAt
    )
  },

  async delete(userId) {
    return invoke(getElectronAPI().db.user.delete, userId)
  }
}

export const contentRepository = {
  isAvailable: () => hasElectronAPI() && !!window.electronAPI?.db?.content,

  async create(content) {
    return invoke(getElectronAPI().db.content.create, content)
  },

  async update(localId, content) {
    return invoke(getElectronAPI().db.content.update, localId, content)
  },

  async findByLocalId(localId) {
    return invoke(getElectronAPI().db.content.findByLocalId, localId)
  },

  async findByServerId(serverId) {
    return invoke(getElectronAPI().db.content.findByServerId, serverId)
  },

  async findByUserId(userId, options) {
    return invoke(getElectronAPI().db.content.findByUserId, userId, options)
  },

  async updateSyncInfo(localId, serverId, version, lastSyncAt) {
    return invoke(
      getElectronAPI().db.content.updateSyncInfo,
      localId,
      serverId,
      version,
      lastSyncAt
    )
  },

  async remove(localId) {
    return invoke(getElectronAPI().db.content.delete, localId)
  }
}

