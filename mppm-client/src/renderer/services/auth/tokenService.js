const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

const subscribers = new Set()

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  return window.localStorage
}

const notify = () => {
  const payload = {
    accessToken: tokenService.getAccessToken(),
    refreshToken: tokenService.getRefreshToken()
  }
  subscribers.forEach((listener) => {
    try {
      listener(payload)
    } catch (error) {
      console.error('Token subscriber error:', error)
    }
  })
}

export const tokenService = {
  getAccessToken() {
    const storage = getStorage()
    return storage ? storage.getItem(ACCESS_TOKEN_KEY) : null
  },

  getRefreshToken() {
    const storage = getStorage()
    return storage ? storage.getItem(REFRESH_TOKEN_KEY) : null
  },

  setTokens({ accessToken, refreshToken }) {
    const storage = getStorage()
    if (!storage) return

    if (accessToken !== undefined) {
      if (accessToken) {
        storage.setItem(ACCESS_TOKEN_KEY, accessToken)
      } else {
        storage.removeItem(ACCESS_TOKEN_KEY)
      }
    }

    if (refreshToken !== undefined) {
      if (refreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      } else {
        storage.removeItem(REFRESH_TOKEN_KEY)
      }
    }

    notify()
  },

  clearTokens() {
    const storage = getStorage()
    if (!storage) return

    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(REFRESH_TOKEN_KEY)
    notify()
  },

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {}
    subscribers.add(listener)
    return () => {
      subscribers.delete(listener)
    }
  }
}

