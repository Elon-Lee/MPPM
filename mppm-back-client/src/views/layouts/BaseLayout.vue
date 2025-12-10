<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">MPPM Admin</div>
      <el-menu router :default-active="$route.path" class="menu" background-color="#1f2937" text-color="#b5bccd" active-text-color="#ffd04b">
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/platforms">
          <el-icon><Monitor /></el-icon>
          <span>平台管理</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="main">
      <header class="header">
        <div class="actions">
          <span class="user-name">{{ authStore.user?.username }}</span>
          <el-button link type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { User, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.replace('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: #111827;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
  flex: 1;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content {
  flex: 1;
  padding: 24px;
  background: #f5f6f8;
  overflow-y: auto;
}
</style>

