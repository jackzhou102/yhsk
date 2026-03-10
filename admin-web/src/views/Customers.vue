<template>
  <div class="customers-page">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索客户名称/邮箱"
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            添加客户
          </el-button>
        </div>
      </div>

      <!-- 客户列表 -->
      <el-table :data="filteredCustomers" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="客户名称" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="company" label="公司" width="200" />
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

    <!-- 创建/编辑客户对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingCustomer ? '编辑客户' : '添加客户'" width="500px">
      <el-form :model="customerForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="customerForm.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="customerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="customerForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="customerForm.company" placeholder="请输入公司名称" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  createdAt: string
}

const loading = ref(false)
const customers = ref<Customer[]>([])
const searchText = ref('')
const showCreateDialog = ref(false)
const saving = ref(false)
const editingCustomer = ref<Customer | null>(null)

const customerForm = reactive({
  name: '',
  email: '',
  phone: '',
  company: ''
})

const filteredCustomers = computed(() => {
  if (!searchText.value) return customers.value
  const search = searchText.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search)
  )
})

const loadCustomers = async () => {
  loading.value = true
  try {
    const res = await api.customers.list()
    if (res.success) {
      customers.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const openEditDialog = (row: Customer) => {
  editingCustomer.value = row
  customerForm.name = row.name
  customerForm.email = row.email
  customerForm.phone = row.phone || ''
  customerForm.company = row.company || ''
  showCreateDialog.value = true
}

const handleSave = async () => {
  if (!customerForm.name || !customerForm.email) {
    ElMessage.warning('请填写名称和邮箱')
    return
  }
  
  saving.value = true
  try {
    let res
    if (editingCustomer.value) {
      res = await api.customers.update(editingCustomer.value.id, customerForm)
    } else {
      res = await api.customers.create(customerForm)
    }
    
    if (res.success) {
      ElMessage.success(editingCustomer.value ? '更新成功' : '添加成功')
      showCreateDialog.value = false
      loadCustomers()
      // 重置表单
      editingCustomer.value = null
      customerForm.name = ''
      customerForm.email = ''
      customerForm.phone = ''
      customerForm.company = ''
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm('确定要删除该客户吗？', '提示', {
      type: 'warning'
    })
    const res = await api.customers.delete(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadCustomers()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>