import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'
import * as keytar from 'keytar'
import { app } from 'electron'

const SERVICE_NAME = app.getName()
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const ITERATIONS = 100000

/**
 * 加密器
 */
class Encryptor {
  /**
   * 从 Keychain 获取或生成密钥
   */
  async getOrCreateKey(keyId) {
    try {
      let key = await keytar.getPassword(SERVICE_NAME, keyId)
      if (!key) {
        // 生成新密钥
        key = randomBytes(KEY_LENGTH).toString('hex')
        await keytar.setPassword(SERVICE_NAME, keyId, key)
      }
      return Buffer.from(key, 'hex')
    } catch (error) {
      console.error('Failed to get or create key:', error)
      throw error
    }
  }

  /**
   * 保存密钥到 Keychain
   */
  async saveKey(keyId, key) {
    try {
      await keytar.setPassword(SERVICE_NAME, keyId, key.toString('hex'))
    } catch (error) {
      console.error('Failed to save key:', error)
      throw error
    }
  }

  /**
   * 从 Keychain 获取密钥
   */
  async getKey(keyId) {
    try {
      const key = await keytar.getPassword(SERVICE_NAME, keyId)
      if (!key) {
        throw new Error(`Key not found: ${keyId}`)
      }
      return Buffer.from(key, 'hex')
    } catch (error) {
      console.error('Failed to get key:', error)
      throw error
    }
  }

  /**
   * 加密数据
   */
  async encrypt(data, keyId = 'default') {
    try {
      const key = await this.getOrCreateKey(keyId)
      const iv = randomBytes(IV_LENGTH)
      const salt = randomBytes(SALT_LENGTH)

      // 使用 PBKDF2 派生密钥
      const derivedKey = pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')

      const cipher = createCipheriv(ALGORITHM, derivedKey, iv)
      const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final()
      ])
      const tag = cipher.getAuthTag()

      // 组合: salt + iv + tag + encrypted
      const result = Buffer.concat([salt, iv, tag, encrypted])
      return result.toString('base64')
    } catch (error) {
      console.error('Encryption failed:', error)
      throw error
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData, keyId = 'default') {
    try {
      const key = await this.getKey(keyId)
      const data = Buffer.from(encryptedData, 'base64')

      // 提取 salt, iv, tag, encrypted
      const salt = data.subarray(0, SALT_LENGTH)
      const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
      const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
      const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

      // 使用 PBKDF2 派生密钥
      const derivedKey = pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')

      const decipher = createDecipheriv(ALGORITHM, derivedKey, iv)
      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])

      return decrypted.toString('utf8')
    } catch (error) {
      console.error('Decryption failed:', error)
      throw error
    }
  }
}

export const encryptor = new Encryptor()

