<template>
  <div class="licenses-page">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索授权码"
            style="width: 200px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="customerFilter" placeholder="客户" clearable style="width: 150px; margin-left: 12px;">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="productFilter" placeholder="产品" clearable style="width: 150px; margin-left: 12px;">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px; margin-left: 12px;">
            <el-option label="未使用" value="unused" />
            <el-option label="激活中" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="已撤销" value="revoked" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 12px; width: 240px;"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="openGenerateDialog">
            <el-icon><Plus /></el-icon>
            生成授权码
          </el-button>
        </div>
      </div>

      <!-- 授权列表 -->
      <el-table :data="filteredLicenses" style="width: 100%" v-loading="loading">
        <el-table-column prop="licenseKey" label="授权码" width="200">
          <template #default="{ row }">
            <el-text type="primary" style="font-family: monospace;">{{ row.licenseKey }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" width="120">
          <template #default="{ row }">
            <span>{{ row.customerName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品" width="120" />
        <el-table-column prop="licenseType" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.licenseType)" size="small">
              {{ getTypeName(row.licenseType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxDevices" label="设备限制" width="80" />
        <el-table-column prop="expireAt" label="过期时间" width="160">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isExpiring(row.expireAt) }">
              {{ formatDate(row.expireAt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleRevoke(row)" v-if="row.status !== 'revoked'">撤销</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 生成授权码对话框 -->
    <el-dialog v-model="showGenerateDialog" title="生成授权码" width="500px">
      <el-form :model="generateForm" label-width="100px" :rules="generateRules" ref="generateFormRef">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="generateForm.customerId" placeholder="请选择客户" style="width: 100%;" filterable>
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品" prop="productId">
          <el-select v-model="generateForm.productId" placeholder="请选择产品" style="width: 100%;" filterable>
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权类型" prop="licenseType">
          <el-select v-model="generateForm.licenseType" placeholder="请选择授权类型" style="width: 100%;">
            <el-option label="试用版" value="trial" />
            <el-option label="专业版" value="professional" />
            <el-option label="企业版" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大设备数">
          <el-input-number v-model="generateForm.maxDevices" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number v-model="generateForm.expireDays" :min="1" :max="3650" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate" :loading="generating">生成</el-button>
      </template>
    </el-dialog>

    <!-- 授权详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="授权详情" width="700px">
      <template v-if="currentLicense">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="授权码">{{ currentLicense.licenseKey }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentLicense.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentLicense.productName }}</el-descriptions-item>
          <el-descriptions-item label="授权类型">{{ getTypeName(currentLicense.licenseType) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusName(currentLicense.status) }}</el-descriptions-item>
          <el-descriptions-item label="最大设备数">{{ currentLicense.maxDevices }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ formatDate(currentLicense.expireAt) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentLicense.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="功能特性" :span="2">
            <el-tag v-for="f in currentLicense.features" :key="f" style="margin-right: 4px;">{{ f }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px; margin-bottom: 10px;">已绑定设备</h4>
        <el-table :data="currentBindings" style="width: 100%">
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="machineCode" label="机器码">
            <template #default="{ row }">
              <el-text style="font-family: monospace; font-size: 12px;">{{ row.machineCode }}</el-text>
            </template>
          </el-table-column>
          <el-table-column prop="bindAt" label="绑定时间">
            <template #default="{ row }">{{ formatDate(row.bindAt) }}</template>
          </el-table-column>
          <el-table-column prop="lastVerifyAt" label="最后验证">
            <template #default="{ row }">{{ formatDate(row.lastVerifyAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleUnbind(row)">解绑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <!-- 显示生成的授权码 -->
    <el-dialog v-model="showResultDialog" title="授权码已生成" width="400px">
      <div class="result-content">
        <p>授权码：</p>
        <el-input v-model="generatedKey" readonly>
          <template #append>
            <el-button @click="copyKey">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

interface License {
  id: string
  licenseKey: string
  customerId?: string
  customerName?: string
  productId?: string
  productName: string
  licenseType: string
  status: string
  maxDevices: number
  expireAt: string
  createdAt: string
  features: string[]
}

interface Customer {
  id: string
  name: string
}

interface Product {
  id: string
  code: string
  name: string
}

const loading = ref(false)
const licenses = ref<License[]>([])
const customers = ref<Customer[]>([])
const products = ref<Product[]>([])
const searchText = ref('')
const customerFilter = ref('')
const productFilter = ref('')
const statusFilter = ref('')
const dateRange = ref<string[]>([])

const showGenerateDialog = ref(false)
const showDetailDialog = ref(false)
const showResultDialog = ref(false)
const generating = ref(false)
const generatedKey = ref('')
const currentLicense = ref<License | null>(null)
const currentBindings = ref<any[]>([])
const generateFormRef = ref<FormInstance>()

const generateForm = reactive({
  customerId: '',
  productId: '',
  licenseType: 'professional',
  maxDevices: 3,
  expireDays: 365
})

const generateRules: FormRules = {
  productId: [
    { required: true, message: '请选择产品', trigger: 'change' }
  ],
  licenseType: [
    { required: true, message: '请选择授权类型', trigger: 'change' }
  ]
}

const filteredLicenses = computed(() => {
  let result = licenses.value
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(l => l.licenseKey.toLowerCase().includes(search))
  }
  
  if (customerFilter.value) {
    result = result.filter(l => l.customerId === customerFilter.value)
  }
  
  if (productFilter.value) {
    result = result.filter(l => l.productId === productFilter.value)
  }
  
  if (statusFilter.value) {
    result = result.filter(l => l.status === statusFilter.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(l => {
      const created = dayjs(l.createdAt).format('YYYY-MM-DD')
      return created >= start && created <= end
    })
  }
  
  return result
})

const loadLicenses = async () => {
  loading.value = true
  try {
    const res = await api.licenses.list()
    if (res.success) {
      licenses.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const loadCustomers = async () => {
  try {
    const res = await api.customers.list()
    if (res.success) {
      customers.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadProducts = async () => {
  try {
    const res = await api.products.list()
    if (res.success) {
      products.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const openGenerateDialog = () => {
  generateForm.customerId = ''
  generateForm.productId = ''
  generateForm.licenseType = 'professional'
  generateForm.maxDevices = 3
  generateForm.expireDays = 365
  showGenerateDialog.value = true
}

const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    trial: '试用版',
    professional: '专业版',
    enterprise: '企业版'
  }
  return map[type] || type
}

const getTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    trial: 'info',
    professional: 'success',
    enterprise: 'warning'
  }
  return map[type] || ''
}

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    unused: '未使用',
    active: '激活中',
    expired: '已过期',
    revoked: '已撤销'
  }
  return map[status] || status
}

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    unused: 'info',
    active: 'success',
    expired: 'danger',
    revoked: 'warning'
  }
  return map[status] || ''
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const isExpiring = (expireAt: string) => {
  const days = dayjs(expireAt).diff(dayjs(), 'day')
  return days <= 30 && days > 0
}

const handleGenerate = async () => {
  if (!generateFormRef.value) return

  await generateFormRef.value.validate(async (valid) => {
    if (!valid) return

    generating.value = true
    try {
      const res = await api.licenses.generate(generateForm)
      if (res.success) {
        generatedKey.value = res.data.licenseKey
        showGenerateDialog.value = false
        showResultDialog.value = true
        loadLicenses()
      } else {
        ElMessage.error(res.message || '生成失败')
      }
    } finally {
      generating.value = false
    }
  })
}

const viewDetail = async (row: License) => {
  try {
    const res = await api.licenses.get(row.id)
    if (res.success) {
      currentLicense.value = res.data.license
      currentBindings.value = res.data.bindings
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error(error)
  }
}

const handleRevoke = async (row: License) => {
  try {
    await ElMessageBox.confirm('确定要撤销该授权吗？撤销后将无法恢复。', '警告', {
      type: 'warning'
    })
    const res = await api.licenses.revoke(row.id)
    if (res.success) {
      ElMessage.success('撤销成功')
      loadLicenses()
    } else {
      ElMessage.error(res.message || '撤销失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleDelete = async (row: License) => {
  try {
    await ElMessageBox.confirm('确定要删除该授权吗？此操作不可恢复。', '警告', {
      type: 'warning'
    })
    const res = await api.licenses.delete(row.id)
    if (res.success) {
      ElMessage.success('删除成功')
      loadLicenses()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const handleUnbind = async (binding: any) => {
  try {
    await ElMessageBox.confirm('确定要解绑该设备吗？', '提示', {
      type: 'warning'
    })
    const res = await api.licenses.unbind(currentLicense.value?.id, binding.machineCode)
    if (res.success) {
      ElMessage.success('解绑成功')
      // 刷新详情
      if (currentLicense.value) {
        const detailRes = await api.licenses.get(currentLicense.value.id)
        if (detailRes.success) {
          currentBindings.value = detailRes.data.bindings
        }
      }
    } else {
      ElMessage.error(res.message || '解绑失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const copyKey = () => {
  navigator.clipboard.writeText(generatedKey.value)
  ElMessage.success('已复制到剪贴板')
}

onMounted(() => {
  loadLicenses()
  loadCustomers()
  loadProducts()
})
</script>

<style scoped>
.licenses-page {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.text-danger {
  color: #f56c6c;
}

.result-content {
  padding: 10px 0;
}

.download-btn {
  margin-top: 16px;
  text-align: center;
}
</style>