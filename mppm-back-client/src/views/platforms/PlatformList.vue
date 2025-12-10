<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <div>
          <h3>平台管理</h3>
          <small>新增或删除可供客户端选择的发布平台</small>
        </div>
        <div class="actions">
          <el-button type="primary" @click="openCreate">新增平台</el-button>
        </div>
      </div>
    </template>

    <el-table :data="platformStore.list" stripe v-loading="platformStore.loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="displayName" label="平台名称" min-width="160" />
      <el-table-column prop="name" label="平台编码" min-width="140" />
      <el-table-column label="图标" width="120">
        <template #default="{ row }">
          <el-avatar v-if="row.iconUrl" :src="row.iconUrl" size="small" />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="loginUrl" label="登录地址" min-width="220">
        <template #default="{ row }">
          <a :href="row.loginUrl" target="_blank">{{ row.loginUrl }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="homeUrl" label="首页地址" min-width="220">
        <template #default="{ row }">
          <a :href="row.homeUrl" target="_blank">{{ row.homeUrl }}</a>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该平台？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑平台' : '新增平台'" width="520px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="平台编码" prop="name">
        <el-input v-model="form.name" placeholder="仅限字母/数字/短横线" />
      </el-form-item>
      <el-form-item label="平台名称" prop="displayName">
        <el-input v-model="form.displayName" />
      </el-form-item>
      <el-form-item label="平台图标" prop="iconUrl">
        <el-input v-model="form.iconUrl" placeholder="图标 URL" />
      </el-form-item>
      <el-form-item label="登录地址" prop="loginUrl">
        <el-input v-model="form.loginUrl" placeholder="例如：https://passport.xxx.com/login" />
      </el-form-item>
      <el-form-item label="首页地址" prop="homeUrl">
        <el-input v-model="form.homeUrl" placeholder="登录后首页 URL" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { usePlatformStore } from '@/store/modules/platform'

const platformStore = usePlatformStore()
const dialogVisible = ref(false)
const formRef = ref(null)
const saving = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  name: '',
  displayName: '',
  iconUrl: '',
  loginUrl: '',
  homeUrl: ''
})

const rules = {
  name: [
    { required: true, message: '请输入平台编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '仅限字母、数字与短横线', trigger: 'blur' }
  ],
  displayName: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  loginUrl: [{ required: true, message: '请输入登录地址', trigger: 'blur' }]
}

onMounted(() => {
  platformStore.fetchPlatforms()
})

const openCreate = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.displayName = ''
  form.iconUrl = ''
  form.loginUrl = ''
  form.homeUrl = ''
  formRef.value?.clearValidate()
}

const openEdit = (row) => {
  resetForm()
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.displayName = row.displayName
  form.iconUrl = row.iconUrl
  form.loginUrl = row.loginUrl
  form.homeUrl = row.homeUrl
  dialogVisible.value = true
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (isEdit.value && form.id) {
        await platformStore.updatePlatform(form.id, {
          name: form.name,
          displayName: form.displayName,
          iconUrl: form.iconUrl,
          loginUrl: form.loginUrl,
          homeUrl: form.homeUrl
        })
      } else {
        await platformStore.createPlatform({
          name: form.name,
          displayName: form.displayName,
          iconUrl: form.iconUrl,
          loginUrl: form.loginUrl,
          homeUrl: form.homeUrl
        })
      }
      dialogVisible.value = false
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = (row) => {
  platformStore.deletePlatform(row.id)
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>

