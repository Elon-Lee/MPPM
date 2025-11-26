<template>
  <div class="content-page">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题或内容"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="status" placeholder="状态筛选" clearable @change="handleSearch">
        <el-option label="草稿" value="DRAFT" />
        <el-option label="已发布" value="PUBLISHED" />
        <el-option label="归档" value="ARCHIVED" />
      </el-select>
      <div class="actions">
        <el-button @click="handleSearch">查询</el-button>
        <el-button type="primary" @click="openCreate">新建内容</el-button>
      </div>
    </div>

    <el-table :data="contentStore.list" border stripe v-loading="contentStore.loading">
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="contentType" label="类型" width="120" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="90" />
      <el-table-column prop="updatedAt" label="更新时间" width="200">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :current-page="contentStore.page"
        :page-size="contentStore.size"
        :total="contentStore.total"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="editorVisible" :title="isEdit ? '编辑内容' : '新建内容'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="类型" prop="contentType">
          <el-select v-model="form.contentType">
            <el-option label="图文" value="ARTICLE" />
            <el-option label="视频" value="VIDEO" />
            <el-option label="图片" value="IMAGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="归档" value="ARCHIVED" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessageBox } from 'element-plus'
import { useContentStore } from '@/store/modules/content'

const contentStore = useContentStore()
const keyword = ref(contentStore.keyword)
const status = ref(contentStore.status || '')
const editorVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  contentType: 'ARTICLE',
  status: 'DRAFT',
  content: '',
  version: 1
})

const rules = {
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const isEdit = computed(() => !!form.id)

onMounted(async () => {
  await contentStore.fetchList()
})

const handleSearch = () => {
  contentStore.fetchList({ page: 1, keyword: keyword.value, status: status.value })
}

const handlePageChange = (page) => {
  contentStore.fetchList({ page })
}

const openCreate = () => {
  resetForm()
  editorVisible.value = true
}

const openEdit = (row) => {
  form.id = row.id
  form.title = row.title
  form.content = row.content
  form.contentType = row.contentType
  form.status = row.status
  form.version = row.version
  editorVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.content = ''
  form.contentType = 'ARTICLE'
  form.status = 'DRAFT'
  form.version = 1
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = {
        title: form.title,
        content: form.content,
        contentType: form.contentType,
        status: form.status
      }
      if (isEdit.value) {
        await contentStore.update(form.id, { ...payload, version: form.version })
      } else {
        await contentStore.create(payload)
      }
      editorVisible.value = false
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await contentStore.remove(row.id)
  })
}

const statusTagType = (value) => {
  switch (value) {
    case 'PUBLISHED':
      return 'success'
    case 'ARCHIVED':
      return 'info'
    default:
      return 'warning'
  }
}

const statusLabel = (value) => {
  switch (value) {
    case 'PUBLISHED':
      return '已发布'
    case 'ARCHIVED':
      return '已归档'
    default:
      return '草稿'
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.content-page {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar .actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}
</style>

