import { syncAPI } from '@/services/api/sync'
import { userRepository, contentRepository } from '@/services/storage/database'
import { useSyncStore } from '@/store/modules/sync'

const ENTITY_TYPE = 'CONTENT'

const getUserId = (user) => {
  if (!user) return null
  return user.user_id || user.id?.toString()
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

export const syncEngine = {
  async syncContents() {
    const syncStore = useSyncStore()
    if (!userRepository.isAvailable() || !contentRepository.isAvailable()) return null
    const user = await userRepository.getCurrent()
    const userId = getUserId(user)
    if (!userId) return null

    await this.pushLocalChanges(userId, syncStore)
    return this.pullServerChanges(userId, syncStore)
  },

  async pushLocalChanges(userId, syncStore = useSyncStore()) {
    const localRows = await contentRepository.findDirty(userId)
    if (!localRows || localRows.length === 0) return null

    const entities = localRows.map((row) => ({
      localId: row.local_id,
      serverId: row.server_id ? Number(row.server_id) : null,
      version: row.version,
      lastModified: row.updated_at ? row.updated_at * 1000 : Date.now(),
      data: {
        title: row.title,
        content: row.content,
        contentType: row.content_type,
        status: row.status
      }
    }))

    const response = await syncAPI.upload({
      entityType: ENTITY_TYPE,
      entities
    })

    if (response?.results) {
      for (const result of response.results) {
        await contentRepository.updateSyncInfo(
          result.localId,
          result.serverId,
          result.version,
          nowSeconds()
        )
      }
    }

    if (response?.conflicts?.length) {
      syncStore.setConflicts(response.conflicts)
    } else {
      syncStore.clearConflicts()
    }

    return response
  },

  async pullServerChanges(userId, syncStore = useSyncStore()) {
    const lastSyncAt = syncStore.getLastSyncAt(userId)

    const response = await syncAPI.download({
      entityType: ENTITY_TYPE,
      lastSyncAt
    })

    if (response?.entities) {
      for (const entity of response.entities) {
        await this.upsertLocalContent(userId, entity)
      }
    }

    if (response?.serverTime) {
      syncStore.setLastSyncAt(userId, response.serverTime)
    }

    return response
  },

  async upsertLocalContent(userId, entity) {
    const local = await contentRepository.findByServerId(entity.id)
    const payload = {
      title: entity.title,
      content: entity.content,
      contentType: entity.contentType,
      status: entity.status,
      version: entity.version
    }

    if (local) {
      await contentRepository.update(local.local_id, payload)
      await contentRepository.updateSyncInfo(local.local_id, entity.id, entity.version, nowSeconds())
    } else {
      const localId = entity.id.toString()
      await contentRepository.create({
        localId,
        serverId: entity.id,
        userId,
        title: entity.title,
        content: entity.content,
        contentType: entity.contentType,
        status: entity.status
      })
      await contentRepository.updateSyncInfo(localId, entity.id, entity.version, nowSeconds())
    }
  },

  async resolveConflict(conflict, resolution, mergedData) {
    await syncAPI.resolveConflict({
      resolution,
      serverId: conflict.serverId,
      localId: conflict.localId,
      mergedData
    })
    const syncStore = useSyncStore()
    syncStore.clearConflicts()
  }
}

