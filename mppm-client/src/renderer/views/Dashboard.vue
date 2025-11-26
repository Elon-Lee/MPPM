<template>
  <div class="dashboard-container">
    <el-container>
      <el-header>
        <h1>MPPM Client Dashboard</h1>
      </el-header>
      <el-main>
        <div class="cards">
          <el-card>
            <template #header>
              <span>账号工作台</span>
            </template>
            <p>统一管理多平台账号，支持添加、同步、批量重登。</p>
            <div class="card-actions">
              <el-button type="primary" @click="goAccounts">进入账号管理</el-button>
            </div>
          </el-card>

          <el-card>
            <template #header>
              <span>内容管理</span>
            </template>
            <p>管理和编辑多平台发布内容，支持草稿、发布、归档状态。</p>
            <div class="card-actions">
              <el-button type="primary" @click="goContent">进入内容管理</el-button>
              <el-button @click="handleSync" :loading="syncing">手动同步</el-button>
            </div>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { syncEngine } from '@/services/sync/syncEngine'

const router = useRouter()
const syncing = ref(false)

onMounted(() => {
  console.log('Dashboard mounted')
})

const goContent = () => {
  router.push('/contents')
}

const goAccounts = () => {
  router.push('/accounts')
}

const handleSync = async () => {
  syncing.value = true
  try {
    await syncEngine.syncContents()
    ElMessage.success('同步完成')
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '同步失败')
  } finally {
    syncing.value = false
  }
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.el-header h1 {
  margin: 0;
  font-size: 20px;
}

.el-main {
  padding: 20px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>

