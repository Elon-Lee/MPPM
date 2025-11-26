<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <div>
          <h3>用户管理</h3>
          <small>管理后台账号、角色与状态</small>
        </div>
        <div class="actions">
          <el-input
            v-model="keyword"
            placeholder="按用户名/邮箱搜索"
            clearable
            class="search"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-button @click="handleSearch">查询</el-button>
          <el-button type="primary" @click="openCreate">新建用户</el-button>
        </div>
      </div>
    </template>

    <el-table :data="userStore.list" stripe v-loading="userStore.loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="roles" label="角色" width="160">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles || []" :key="role" size="small" type="info">{{ role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ row.status === 'ACTIVE' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :current-page="userStore.page"
        :page-size="userStore.size"
        :total="userStore.total"
        @current-change="handlePageChange"
      />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新建用户'" width="500px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item label="角色" prop="roles">
        <el-select v-model="form.roles" multiple placeholder="选择角色">
          <el-option
            v-for="role in roleOptions"
            :key="role.code"
            :label="role.name"
            :value="role.code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status">
          <el-option label="启用" value="ACTIVE" />
          <el-option label="禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!isEdit" label="初始密码" prop="password">
        <el-input v-model="form.password" type="password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/modules/user'
import { ElMessageBox } from 'element-plus'
import { userAPI } from '@/services/api/user'

const userStore = useUserStore()
const keyword = ref('')
const dialogVisible = ref(false)
const formRef = ref(null)
const saving = ref(false)
const roleOptions = ref([])

const form = reactive({
  id: null,
  username: '',
  email: '',
  roles: [],
  status: 'ACTIVE',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

const isEdit = computed(() => !!form.id)

onMounted(async () => {
  userStore.fetchUsers()
  roleOptions.value = await userAPI.roles()
})

const handleSearch = () => {
  userStore.fetchUsers({ page: 1, keyword: keyword.value })
}

const handlePageChange = (page) => {
  userStore.fetchUsers({ page })
}

const openCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  resetForm()
  form.id = row.id
  form.username = row.username
  form.email = row.email
  form.roles = [...(row.roles || [])]
  form.status = row.status
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.username = ''
  form.email = ''
  form.roles = []
  form.status = 'ACTIVE'
  form.password = ''
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (isEdit.value) {
        await userStore.updateUser(form.id, {
          email: form.email,
          roles: form.roles,
          status: form.status
        })
      } else {
        await userStore.createUser({
          username: form.username,
          email: form.email,
          roles: form.roles,
          status: form.status,
          password: form.password
        })
      }
      dialogVisible.value = false
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`删除用户 ${row.username}？`, '提示', {
    type: 'warning'
  }).then(() => userStore.deleteUser(row.id))
}

const handleResetPassword = (row) => {
  ElMessageBox.confirm(`重置用户 ${row.username} 的密码？`, '提示', {
    type: 'info'
  }).then(() => userStore.resetPassword(row.id))
}

const formatDate = (value) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-header h3 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search {
  width: 220px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}
</style>

