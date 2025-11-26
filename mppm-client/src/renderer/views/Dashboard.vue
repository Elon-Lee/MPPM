<template>
  <div class="dashboard-container">
    <el-container>
      <el-header>
        <h1>MPPM Client Dashboard</h1>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>欢迎使用 MPPM Client</span>
          </template>
          <p>这是仪表盘页面，功能正在开发中...</p>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Dashboard mounted')
})
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
</style>

