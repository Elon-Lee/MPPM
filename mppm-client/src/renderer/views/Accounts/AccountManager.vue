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
            v-for="platform in availablePlatforms"
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

    <div class="content-split">
      <div class="content-card list-pane">
        <div class="pane-header">账号列表</div>
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
            <el-table-column label="操作" width="260">
              <template #default="{ row }">
                <el-button link @click="handleOpenAccount(row)">打开</el-button>
                <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
                <el-button link>同步</el-button>
                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <el-dialog v-model="platformPickerVisible" title="选择平台" width="520px">
        <div class="platform-grid">
        <div
          class="platform-card"
            v-for="platform in availablePlatforms"
          :key="platform.id"
          @click="handlePlatformSelect(platform)"
        >
          <div class="icon-circle">{{ (platform.displayName || platform.name || '').slice(0, 2) }}</div>
          <div class="platform-name">{{ platform.displayName || platform.name }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { clientLogger } from '@/services/logger'
import { resolvePlatformOpenUrl } from '@/services/platformUrl'

const accountStore = useAccountStore()
const router = useRouter()
const activeTab = ref('accounts')
const platformFilter = ref('')
const keyword = ref('')
const platformPickerVisible = ref(false)
const dialogLoading = ref(false)
const formRef = ref(null)
const partitionKeyRef = ref('')
const loginForExistingAccount = ref(false)
const form = reactive({
  id: null,
  platformId: null,
  accountName: '',
  status: 'ACTIVE',
  credentials: ''
})

const availablePlatforms = computed(() => {
  return (accountStore.platforms || []).filter(Boolean)
})

const platformMap = computed(() => {
  const map = new Map()
  availablePlatforms.value.forEach((p) => {
    if (p && p.id) {
      map.set(p.id, p)
  }
  })
  return map
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
  if (key === 'workspace') {
    router.push('/dashboard')
  } else if (key === 'accounts') {
    router.push('/accounts')
  } else {
  ElMessage.info(`功能「${key}」暂未实现`)
  }
}

const openCreate = () => {
  resetForm()
  loginForExistingAccount.value = false
  platformPickerVisible.value = true
}

const selectPlatform = (platform) => {
  form.platformId = platform.id
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

const handleOpenAccount = (row) => {
  const platform = platformMap.value.get(row.platformId)
  if (!platform) {
    ElMessage.error('未找到平台信息，无法打开')
    return
  }
  currentLoginPlatform.value = platform
  loginForExistingAccount.value = true
  form.id = row.id
  form.platformId = row.platformId
  form.accountName = row.accountName
  loginPaneVisible.value = true
  openPlatformLogin(platform, {
    accountId: row.id,
    createdAt: row.createdAt || row.lastUpdatedAt,
    accountName: row.accountName
  })
}

const handleSync = () => {
  accountStore.fetchAccounts().then(() => ElMessage.success('同步完成'))
}

const hasElectronPlatform = () => {
  if (typeof window === 'undefined') return false
  if (window.process?.versions?.electron) return true
  return typeof window.electronAPI?.platform?.openLoginWindow === 'function'
}

const formatDateTag = (value) => {
  const d = value ? new Date(value) : new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

const makePartitionKey = (platformName, accountId, createdAt) => {
  const safePlatform = (platformName || 'platform').trim().replace(/\s+/g, '-')
  const safeId = accountId ? String(accountId) : 'new'
  const dateTag = formatDateTag(createdAt)
  return `${safePlatform}-${safeId}-${dateTag}`
}

const openPlatformLogin = async (platform, accountMeta = {}) => {
  if (!platform || !platform.id) {
    ElMessage.error('平台信息缺失，请重新选择')
    return
  }
  if (!hasElectronPlatform()) {
    ElMessage.error('未检测到 Electron 环境或 preload，无法打开登录窗口')
    return
  }
  try {
    const loginUrl =
      resolvePlatformOpenUrl(platform) ||
      'https://passport.weibo.com/sso/signin?entry=account&source=sinareg&url=https%3A%2F%2Flogin.sina.com.cn'
    const platformName = platform.displayName || platform.name
    partitionKeyRef.value = makePartitionKey(platformName, accountMeta.accountId, accountMeta.createdAt)
    await window.electronAPI?.platform?.openLoginWindow?.({
      url: loginUrl,
      partitionKey: partitionKeyRef.value,
      successPatterns: ['mp.163.com', '163.com', 'weibo.com', 'login.sina.com.cn'],
      platformId: platform.id
    })
    ElMessage.success('已打开登录窗口，请完成登录后等待自动保存')
  } catch (error) {
    clientLogger.report('ERROR', 'platform-login', error?.message, error?.stack)
    ElMessage.error(error.message || '打开登录窗口失败')
  }
}

const handlePlatformSelect = (platform) => {
  if (!platform || !platform.id) {
    ElMessage.error('平台信息缺失，请重试')
    return
  }
  loginForExistingAccount.value = false
  selectPlatform(platform)
  platformPickerVisible.value = false
  currentLoginPlatform.value = platform
  if (!form.accountName) {
    form.accountName = `${platform.displayName || platform.name || '账号'}-已登录`
  }
  loginPaneVisible.value = true
  openPlatformLogin(platform, { accountName: form.accountName })
}

const loginPaneVisible = ref(false)
const currentLoginPlatform = ref(null)
const loginStatus = ref('等待登录...')

onMounted(() => {
  if (!hasElectronPlatform()) return
  const off = window.electronAPI?.platform?.onLoginSuccess?.(async ({ platformId, url }) => {
    const targetPlatform =
      availablePlatforms.value.find((p) => p && p.id === platformId) || currentLoginPlatform.value
    if (targetPlatform) {
      form.platformId = targetPlatform.id
      form.accountName = `${targetPlatform.displayName || targetPlatform.name}-已登录`
      form.status = 'ACTIVE'
      loginStatus.value = `检测到登录成功：${url}`
      try {
        if (loginForExistingAccount.value && form.id) {
          ElMessage.success('登录成功')
        } else {
        await accountStore.createAccount({
          platformId: form.platformId,
          accountName: form.accountName,
          status: form.status,
          credentials: form.credentials
        })
        ElMessage.success('登录成功，已自动保存账号')
        }
        loginPaneVisible.value = false
      } catch (error) {
        clientLogger.report('ERROR', 'platform-save', error?.message, error?.stack)
        ElMessage.error(error.message || '保存账号失败')
      }
    }
  })
  // 可选：返回值用于移除监听
  if (typeof off === 'function') {
    onUnmounted(() => off())
  }
})
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

.content-split {
  display: grid;
  grid-template-columns: 0.2fr 0.8fr;
  gap: 16px;
  align-items: stretch;
}

.pane-header {
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.flex-between {
  justify-content: space-between;
}

.pane-actions {
  display: flex;
  gap: 8px;
}

.login-pane {
  display: flex;
  flex-direction: column;
  min-height: 520px;
}

.login-status {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
}

.login-iframe {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.login-iframe iframe {
  width: 100%;
  height: 100%;
  background: #fff;
}

.dialog-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  min-height: 320px;
}

.platform-list {
  border-right: 1px solid #ebeef5;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
}

.platform-item.active {
  border-color: #409eff;
  background: #f0f6ff;
}

.platform-name {
  font-weight: 600;
}

.platform-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-hint {
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  color: #606266;
  border-radius: 6px;
  font-size: 13px;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.platform-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.platform-card:hover {
  border-color: #409eff;
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>

