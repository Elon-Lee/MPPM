import { syncAPI } from '@/services/api/sync'
import { userRepository, contentRepository } from '@/services/storage/database'

const ENTITY_TYPE = 'CONTENT'

const getUserId = (user) => {
  if (!user) return null
  return user.user_id || user.id?.toString()
}

const toISO = (seconds) => {
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString()
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

export const syncEngine = {
  async syncContents() {
    if (!userRepository.isAvailable() || !contentRepository.isAvailable()) return null
    const user = await userRepository.getCurrent()
    const userId = getUserId(user)
    if (!userId) return null

    await this.pushLocalChanges(userId)
    return this.pullServerChanges(userId)
  },

  async pushLocalChanges(userId) {
    const localRows = await contentRepository.findByUserId(userId, { limit: 500 })
    if (!localRows || localRows.length === 0) return null

    const entities = localRows.map((row) => ({
      localId: row.local_id,
      serverId: row.server_id ? Number(row.server_id) : null,
      version: row.version,
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

    return response
  },

  async pullServerChanges(userId) {
    const latest = await contentRepository.findByUserId(userId, { limit: 1 })
    const lastSyncAt = latest?.[0]?.updated_at ? toISO(latest[0].updated_at) : null

    const response = await syncAPI.download({
      entityType: ENTITY_TYPE,
      lastSyncAt
    })

    if (response?.entities) {
      for (const entity of response.entities) {
        await this.upsertLocalContent(userId, entity)
      }
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
  }
}

