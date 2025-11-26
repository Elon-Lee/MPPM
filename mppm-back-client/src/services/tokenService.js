const ACCESS_TOKEN_KEY = 'mppm_admin_access_token'
const REFRESH_TOKEN_KEY = 'mppm_admin_refresh_token'
const USER_INFO_KEY = 'mppm_admin_user'

const safeStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export const tokenService = {
  setTokens(accessToken, refreshToken, user) {
    const storage = safeStorage()
    if (!storage) return
    if (accessToken) {
      storage.setItem(ACCESS_TOKEN_KEY, accessToken)
    }
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
    if (user) {
      storage.setItem(USER_INFO_KEY, JSON.stringify(user))
    }
  },

  getAccessToken() {
    return safeStorage()?.getItem(ACCESS_TOKEN_KEY) || null
  },

  getRefreshToken() {
    return safeStorage()?.getItem(REFRESH_TOKEN_KEY) || null
  },

  getUserInfo() {
    const storage = safeStorage()
    if (!storage) return null
    const raw = storage.getItem(USER_INFO_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  },

  clear() {
    const storage = safeStorage()
    if (!storage) return
    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
    storage.removeItem(USER_INFO_KEY)
  }
}

