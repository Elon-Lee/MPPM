import { createApp } from 'vue'
import { pinia } from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { clientLogger } from '@/services/logger'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.config.errorHandler = (err, instance, info) => {
  clientLogger.report('ERROR', info || 'vue', err?.message || 'Unknown', err?.stack)
  console.error(err)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

