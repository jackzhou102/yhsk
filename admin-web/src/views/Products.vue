<template>
  <div class="products-page">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索产品代码/名称"
            style="width: 300px"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增产品
          </el-button>
        </div>
      </div>

      <!-- 产品列表 -->
      <el-table :data="filteredProducts" style="width: 100%" v-loading="loading">
        <el-table-column prop="code" label="产品代码" width="150">
          <template #default="{ row }">
            <el-text type="primary" style="font-family: monospace;">{{ row.code }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="产品名称" width="200" />
        <el-table-column prop="description" label="产品描述" min-width="300">
          <template #default="{ row }">
            <span>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑产品对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingProduct ? '编辑产品' : '新增产品'" width="500px">
      <el-form :model="productForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="产品代码" prop="code">
          <el-input v-model="productForm.code" placeholder="请输入产品代码" :disabled="!!editingProduct" />
        </el-form-item>
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品描述">
          <el-input v-model="productForm.description" type="textarea" :rows="3" placeholder="请输入产品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

interface Product {
  id: string
  code: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

const loading = ref(false)
const saving = ref(false)
const products = ref<Product[]>([])
const searchText = ref('')
const showCreateDialog = ref(false)
const editingProduct = ref<Product | null>(null)
const formRef = ref<FormInstance>()

const productForm = reactive({
  code: '',
  name: '',
  description: ''
})

const rules: FormRules = {
  code: [
    { required: true, message: '请输入产品代码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '产品代码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ]
}

const filteredProducts = computed(() => {
  if (!searchText.value) return products.value
  const search = searchText.value.toLowerCase()
  return products.value.filter(p =>
    p.code.toLowerCase().includes(search) ||
    p.name.toLowerCase().includes(search)
  )
})

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await api.products.list()
    if (res.success) {
      products.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const openEditDialog = (row: Product) => {
  editingProduct.value = row
  productForm.code = row.code
  productForm.name = row.name
  productForm.description = row.description || ''
  showCreateDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      let res
      if (editingProduct.value) {
        res = await api.products.update(editingProduct.value.id, {
          name: productForm.name,
          description: productForm.description
        })
      } else {
        res = await api.products.create(productForm)
      }

      if (res.success) {
        ElMessage.success(editingProduct.value ? '更新成功' : '创建成功')
        showCreateDialog.value = false
        loadProducts()
        resetForm()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm('确定要删除该产品吗？', '警告', {
      type: 'warning'
    })
    const res = await api.products.delete(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadProducts()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const resetForm = () => {
  editingProduct.value = null
  productForm.code = ''
  productForm.name = ''
  productForm.description = ''
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.products-page {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}
</style>