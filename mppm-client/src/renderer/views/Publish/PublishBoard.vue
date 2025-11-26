<template>
  <div class="publish-page">
    <div class="hero">
      <div class="info">
        <h2>发布中心</h2>
        <p>统一创建任务，实时掌握多平台发布状态。</p>
        <div class="hero-actions">
          <el-button type="primary" @click="openCreate">新建发布任务</el-button>
          <el-button @click="publishStore.fetchTasks()">刷新列表</el-button>
        </div>
      </div>
      <div class="stats">
        <div class="stat">
          <span class="label">今日发布</span>
          <strong>{{ todayStats.total }}</strong>
        </div>
        <div class="stat">
          <span class="label">成功</span>
          <strong>{{ todayStats.success }}</strong>
        </div>
        <div class="stat">
          <span class="label">失败</span>
          <strong>{{ todayStats.failed }}</strong>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <div class="filters">
            <el-select v-model="statusFilter" placeholder="全部状态" clearable>
              <el-option label="待处理" value="PENDING" />
              <el-option label="进行中" value="RUNNING" />
              <el-option label="成功" value="SUCCESS" />
              <el-option label="失败" value="FAILED" />
            </el-select>
            <el-select v-model="platformFilter" placeholder="平台" clearable>
              <el-option label="全部" value="" />
              <el-option
                v-for="platform in accountStore.platforms"
                :key="platform.id"
                :label="platform.displayName || platform.name"
                :value="platform.id"
              />
            </el-select>
          </div>
          <el-input
            v-model="keyword"
            placeholder="按内容或任务搜索（演示）"
            suffix-icon="Search"
            clearable
          />
        </div>
      </template>

      <el-table :data="filteredTasks" v-loading="publishStore.loading" stripe :virtualized="true">
        <el-table-column prop="id" label="任务ID" width="100" />
        <el-table-column prop="platformName" label="平台" width="140" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishUrl" label="发布链接" min-width="200">
          <template #default="{ row }">
            <a v-if="row.publishUrl" :href="row.publishUrl" target="_blank" rel="noopener">
              {{ row.publishUrl }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="200">
          <template #default="{ row }">
            <span v-if="row.errorMessage">{{ row.errorMessage }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="publishStore.page"
          :page-size="publishStore.size"
          :total="publishStore.total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建发布任务" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="平台" prop="platformId">
          <el-select v-model="form.platformId" placeholder="选择发布平台">
            <el-option
              v-for="platform in accountStore.platforms"
              :key="platform.id"
              :label="platform.displayName || platform.name"
              :value="platform.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容ID" prop="contentId">
          <el-input-number v-model="form.contentId" :min="1" />
        </el-form-item>
        <el-form-item label="发布配置">
          <el-input
            v-model="form.config"
            type="textarea"
            rows="3"
            placeholder="可填写平台所需附加配置(JSON)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { usePublishStore } from '@/store/modules/publish'
import { useAccountStore } from '@/store/modules/account'
import { useDebounce } from '@/composables/useDebounce'

const publishStore = usePublishStore()
const accountStore = useAccountStore()
const statusFilter = ref('')
const platformFilter = ref('')
const keyword = ref('')
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  platformId: null,
  contentId: null,
  config: ''
})

const rules = {
  platformId: [{ required: true, message: '请选择平台', trigger: 'change' }],
  contentId: [{ required: true, message: '请输入内容ID', trigger: 'change' }]
}

const todayStats = reactive({
  total: 12,
  success: 10,
  failed: 2
})

onMounted(() => {
  accountStore.fetchPlatforms()
  publishStore.fetchTasks()
})

const debouncedStatus = useDebounce(statusFilter, 200)
const debouncedPlatform = useDebounce(platformFilter, 200)
const debouncedKeyword = useDebounce(keyword, 300)

watch([debouncedStatus, debouncedPlatform, debouncedKeyword], () => {
  publishStore.fetchTasks({
    status: debouncedStatus.value || undefined,
    platformId: debouncedPlatform.value ? Number(debouncedPlatform.value) : undefined,
    keyword: debouncedKeyword.value || undefined
  })
})

const filteredTasks = computed(() => {
  return publishStore.tasks.filter((task) => {
    const statusMatch = debouncedStatus.value ? task.status === debouncedStatus.value : true
    const platformMatch = debouncedPlatform.value
      ? task.platformId === Number(debouncedPlatform.value)
      : true
    const keywordMatch = debouncedKeyword.value
      ? `${task.id}`.includes(debouncedKeyword.value) ||
        task.platformName?.includes(debouncedKeyword.value) ||
        task.publishUrl?.includes(debouncedKeyword.value)
      : true
    return statusMatch && platformMatch && keywordMatch
  })
})

const formatDate = (value) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

const statusTagType = (status) => {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'FAILED':
      return 'danger'
    case 'RUNNING':
      return 'warning'
    default:
      return 'info'
  }
}

const statusLabel = (status) => {
  switch (status) {
    case 'SUCCESS':
      return '成功'
    case 'FAILED':
      return '失败'
    case 'RUNNING':
      return '进行中'
    case 'PENDING':
    default:
      return '待处理'
  }
}

const handlePageChange = (page) => {
  publishStore.fetchTasks({
    page,
    status: debouncedStatus.value || undefined,
    platformId: debouncedPlatform.value ? Number(debouncedPlatform.value) : undefined,
    keyword: debouncedKeyword.value || undefined
  })
}

const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const resetForm = () => {
  form.platformId = null
  form.contentId = null
  form.config = ''
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      await publishStore.createTask({
        platformId: form.platformId,
        contentId: form.contentId,
        config: form.config
      })
      dialogVisible.value = false
    } finally {
      dialogLoading.value = false
    }
  })
}
</script>

<style scoped>
.publish-page {
  padding: 24px;
  background: #f5f6fb;
  min-height: 100%;
}

.hero {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(120deg, #5c7cfe 0%, #7aa7ff 100%);
  color: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.hero h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat {
  background: rgba(255, 255, 255, 0.2);
  padding: 16px;
  border-radius: 12px;
  min-width: 100px;
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.stat strong {
  font-size: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}
</style>

