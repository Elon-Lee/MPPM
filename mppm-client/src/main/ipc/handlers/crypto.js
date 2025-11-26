import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { encryptor } from '../../crypto/encryptor'

/**
 * 加密操作 IPC 处理器
 */
export function handleCrypto() {
  ipcMain.handle(IPC_CHANNELS.CRYPTO_ENCRYPT, async (event, data, keyId) => {
    try {
      const encrypted = await encryptor.encrypt(data, keyId)
      return { success: true, data: encrypted }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CRYPTO_DECRYPT, async (event, encryptedData, keyId) => {
    try {
      const decrypted = await encryptor.decrypt(encryptedData, keyId)
      return { success: true, data: decrypted }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CRYPTO_SAVE_KEY, async (event, keyId, key) => {
    try {
      await encryptor.saveKey(keyId, key)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.CRYPTO_GET_KEY, async (event, keyId) => {
    try {
      const key = await encryptor.getKey(keyId)
      return { success: true, data: key }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

