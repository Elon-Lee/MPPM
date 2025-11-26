import { defineStore } from 'pinia'

const KEY_PREFIX = 'sync:last:content:'

export const useSyncStore = defineStore('sync', {
  state: () => ({
    conflicts: [],
    lastSyncByUser: {}
  }),
  actions: {
    setConflicts(list = []) {
      this.conflicts = list
    },
    clearConflicts() {
      this.conflicts = []
    },
    getLastSyncAt(userId) {
      if (!userId) return null
      if (this.lastSyncByUser[userId]) {
        return this.lastSyncByUser[userId]
      }
      const stored = localStorage.getItem(KEY_PREFIX + userId)
      if (stored) {
        this.lastSyncByUser[userId] = stored
      }
      return stored
    },
    setLastSyncAt(userId, value) {
      if (!userId) return
      this.lastSyncByUser[userId] = value
      if (value) {
        localStorage.setItem(KEY_PREFIX + userId, value)
      } else {
        localStorage.removeItem(KEY_PREFIX + userId)
      }
    }
  }
})

