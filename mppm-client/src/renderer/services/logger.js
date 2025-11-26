import { logAPI } from '@/services/api/logs'

class ClientLogger {
  constructor() {
    this.queue = []
    this.sending = false
    this.installGlobalHandlers()
  }

  installGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.report('ERROR', 'window', event.message, event.error?.stack)
    })

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason)
      const stack = event.reason?.stack
      this.report('ERROR', 'promise', reason, stack)
    })
  }

  async report(level, module, message, stackTrace, extra = {}) {
    const payload = {
      level,
      module,
      message,
      stackTrace,
      clientInfo: JSON.stringify({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        ...extra
      })
    }
    this.queue.push(payload)
    this.flush()
  }

  async flush() {
    if (this.sending || this.queue.length === 0) return
    this.sending = true
    const batch = this.queue.splice(0, this.queue.length)
    for (const item of batch) {
      try {
        await logAPI.submit(item)
      } catch (error) {
        console.error('log submit failed', error)
        this.queue.unshift(item)
        break
      }
    }
    this.sending = false
  }
}

export const clientLogger = new ClientLogger()

