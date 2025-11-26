<template>
  <div class="accounts-page">
    <div class="top-bar">
      <div class="logo">账号工作台</div>
      <el-menu mode="horizontal" :default-active="activeTab" @select="handleMenuSelect">
        <el-menu-item index="workspace"><el-icon><Monitor /></el-icon>工作台</el-menu-item>
        <el-menu-item index="accounts"><el-icon><User /></el-icon>账号</el-menu-item>
        <el-menu-item index="publish"><el-icon><EditPen /></el-icon>发图文</el-menu-item>
        <el-menu-item index="video"><el-icon><VideoCamera /></el-icon>发视频</el-menu-item>
        <el-menu-item index="data"><el-icon><DataLine /></el-icon>数据</el-menu-item>
        <el-menu-item index="team"><el-icon><UserFilled /></el-icon>团队</el-menu-item>
        <el-menu-item index="plan"><el-icon><Document /></el-icon>热词榜单</el-menu-item>
        <el-menu-item index="ai"><el-icon><MagicStick /></el-icon>AI创作</el-menu-item>
        <el-menu-item index="interaction"><el-icon><ChatDotRound /></el-icon>互动管理</el-menu-item>
      </el-menu>
      <div class="top-actions">
        <el-button round>升级续费</el-button>
        <el-button type="primary" round>同步中心</el-button>
        <el-avatar icon="UserFilled" />
      </div>
    </div>

    <div class="toolbar">
      <div class="left">
        <el-button type="primary" @click="openCreate">添加账号</el-button>
        <el-button @click="handleSync" :loading="accountStore.loading">同步账号</el-button>
        <el-button>账号管理</el-button>
        <el-button>账号分组</el-button>
        <el-button>一键重登</el-button>
      </div>
      <div class="right">
        <el-select v-model="platformFilter" placeholder="全部平台" clearable>
          <el-option label="全部平台" value="" />
          <el-option
            v-for="platform in accountStore.platforms"
            :key="platform.id"
            :label="platform.displayName || platform.name"
            :value="platform.id"
          />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="输入账号名称/备注"
          suffix-icon="Search"
          clearable
        />
      </div>
    </div>

    <div class="content-card">
      <div v-if="accountStore.list.length === 0" class="empty-state">
        <el-empty description="您还没有账号，赶紧去“添加账号”" />
        <el-button type="primary" @click="openCreate">添加账号</el-button>
      </div>
      <div v-else class="account-table">
        <el-table :data="filteredAccounts" stripe :virtualized="true">
          <el-table-column label="平台" prop="platformDisplayName" width="140" />
          <el-table-column label="账号名称" prop="accountName" min-width="160" />
          <el-table-column label="状态" prop="status" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === 'ACTIVE' ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近同步" prop="lastUpdatedAt" width="200">
            <template #default="{ row }">
              {{ formatDate(row.lastUpdatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
              <el-button link>同步</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账号' : '添加账号'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="平台" prop="platformId">
          <el-select v-model="form.platformId" placeholder="选择平台">
            <el-option
              v-for="platform in accountStore.platforms"
              :key="platform.id"
              :label="platform.displayName || platform.name"
              :value="platform.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号名称" prop="accountName">
          <el-input v-model="form.accountName" placeholder="请输入账号昵称" />
        </el-form-item>
        <el-form-item label="凭证信息">
          <el-input
            v-model="form.credentials"
            type="textarea"
            placeholder="Cookies/Token，实际存储将加密"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="在线" value="ACTIVE" />
            <el-option label="离线" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">
          {{ isEdit ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import {
  Monitor,
  User,
  EditPen,
  VideoCamera,
  DataLine,
  UserFilled,
  Document,
  MagicStick,
  ChatDotRound
} from '@element-plus/icons-vue'
import { useAccountStore } from '@/store/modules/account'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDebounce } from '@/composables/useDebounce'

const accountStore = useAccountStore()
const activeTab = ref('accounts')
const platformFilter = ref('')
const keyword = ref('')
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  platformId: null,
  accountName: '',
  status: 'ACTIVE',
  credentials: ''
})

const rules = {
  platformId: [{ required: true, message: '请选择平台', trigger: 'change' }],
  accountName: [{ required: true, message: '请输入账号名称', trigger: 'blur' }]
}

const isEdit = computed(() => !!form.id)

onMounted(() => {
  accountStore.fetchPlatforms()
  accountStore.fetchAccounts()
})

const debouncedPlatform = useDebounce(platformFilter, 200)
const debouncedKeyword = useDebounce(keyword, 300)

watch([debouncedPlatform, debouncedKeyword], () => {
  accountStore.fetchAccounts({
    platformId: debouncedPlatform.value ? Number(debouncedPlatform.value) : undefined,
    keyword: debouncedKeyword.value || undefined
  })
})

const filteredAccounts = computed(() => {
  const platformValue = debouncedPlatform.value ? Number(debouncedPlatform.value) : null
  return accountStore.list.filter((item) => {
    const platformMatch = platformValue ? item.platformId === platformValue : true
    const keywordMatch = debouncedKeyword.value ? item.accountName?.includes(debouncedKeyword.value) : true
    return platformMatch && keywordMatch
  })
})

const formatDate = (value) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

const handleMenuSelect = (key) => {
  activeTab.value = key
  ElMessage.info(`功能「${key}」暂未实现`)
}

const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  form.id = row.id
  form.platformId = row.platformId
  form.accountName = row.accountName
  form.status = row.status
  form.credentials = ''
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.platformId = null
  form.accountName = ''
  form.status = 'ACTIVE'
  form.credentials = ''
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      const payload = {
        platformId: form.platformId,
        accountName: form.accountName,
        status: form.status,
        credentials: form.credentials
      }
      if (isEdit.value) {
        await accountStore.updateAccount(form.id, payload)
      } else {
        await accountStore.createAccount(payload)
      }
      dialogVisible.value = false
    } finally {
      dialogLoading.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除账号「${row.accountName}」?`, '提示', {
    type: 'warning'
  }).then(() => accountStore.deleteAccount(row.id))
}

const handleSync = () => {
  accountStore.fetchAccounts().then(() => ElMessage.success('同步完成'))
}
</script>

<style scoped>
.accounts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f6fb;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: #4d6fff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  gap: 24px;
}

.logo {
  font-size: 18px;
  font-weight: 600;
}

.top-bar :deep(.el-menu) {
  background: transparent;
  border-bottom: none;
}

.top-bar :deep(.el-menu-item) {
  color: #dfe5ff;
}

.top-bar :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-radius: 6px;
}

.top-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.toolbar .left,
.toolbar .right {
  display: flex;
  gap: 10px;
}

.content-card {
  flex: 1;
  margin: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(15, 45, 90, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state {
  text-align: center;
}

.account-table {
  width: 100%;
}
</style>

