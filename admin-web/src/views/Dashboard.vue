<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #3b82f6;">
            <el-icon :size="28"><Ticket /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalLicenses }}</div>
            <div class="stat-label">授权总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #10b981;">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeLicenses }}</div>
            <div class="stat-label">激活授权</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f59e0b;">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.expiringLicenses }}</div>
            <div class="stat-label">即将过期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #8b5cf6;">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCustomers }}</div>
            <div class="stat-label">客户总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="showGenerateDialog = true">
              <el-icon><Plus /></el-icon>
              生成授权码
            </el-button>
            <el-button type="success" @click="showOfflineDialog = true">
              <el-icon><Download /></el-icon>
              生成离线授权
            </el-button>
            <el-button @click="$router.push('/customers')">
              <el-icon><UserFilled /></el-icon>
              客户管理
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>授权类型说明</span>
            </div>
          </template>
          <el-table :data="licenseTypes" style="width: 100%">
            <el-table-column prop="name" label="类型" width="120" />
            <el-table-column prop="devices" label="设备数" width="100" />
            <el-table-column prop="features" label="功能特性" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 生成授权码对话框 -->
    <el-dialog v-model="showGenerateDialog" title="生成授权码" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="产品名称" required>
          <el-input v-model="generateForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="授权类型" required>
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

    <!-- 生成离线授权对话框 -->
    <el-dialog v-model="showOfflineDialog" title="生成离线授权文件" width="500px">
      <el-form :model="offlineForm" label-width="100px">
        <el-form-item label="授权码" required>
          <el-input v-model="offlineForm.licenseKey" placeholder="请输入授权码" />
        </el-form-item>
        <el-form-item label="机器码" required>
          <el-input v-model="offlineForm.machineCode" placeholder="请输入客户端机器码" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="offlineForm.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOfflineDialog = false">取消</el-button>
        <el-button type="primary" @click="handleGenerateOffline" :loading="generatingOffline">生成</el-button>
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

    <!-- 显示离线授权文件 -->
    <el-dialog v-model="showOfflineResultDialog" title="离线授权文件" width="600px">
      <div class="result-content">
        <p>授权文件内容（请保存为 .lic 文件）：</p>
        <el-input v-model="offlineContent" type="textarea" :rows="6" readonly />
        <div class="download-btn">
          <el-button type="primary" @click="downloadLicense">下载授权文件</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const stats = reactive({
  totalLicenses: 0,
  activeLicenses: 0,
  expiringLicenses: 0,
  totalCustomers: 0
})

const licenseTypes = [
  { name: '试用版', devices: '1台', features: '基础功能' },
  { name: '专业版', devices: '3台', features: '基础功能 + 高级功能 + 导出' },
  { name: '企业版', devices: '10台', features: '全部功能 + API + 优先支持' }
]

const showGenerateDialog = ref(false)
const showOfflineDialog = ref(false)
const showResultDialog = ref(false)
const showOfflineResultDialog = ref(false)
const generating = ref(false)
const generatingOffline = ref(false)
const generatedKey = ref('')
const offlineContent = ref('')

const generateForm = reactive({
  productName: '',
  licenseType: 'professional',
  maxDevices: 3,
  expireDays: 365
})

const offlineForm = reactive({
  licenseKey: '',
  machineCode: '',
  deviceName: ''
})

const loadStats = async () => {
  try {
    const [licenseRes, customerRes] = await Promise.all([
      api.licenses.list(),
      api.customers.list()
    ])
    
    if (licenseRes.success) {
      const licenses = licenseRes.data
      stats.totalLicenses = licenses.length
      stats.activeLicenses = licenses.filter((l: any) => l.status === 'active').length
      
      // 计算即将过期（30天内）
      const now = new Date()
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      stats.expiringLicenses = licenses.filter((l: any) => {
        const expireAt = new Date(l.expireAt)
        return expireAt > now && expireAt <= thirtyDaysLater
      }).length
    }
    
    if (customerRes.success) {
      stats.totalCustomers = customerRes.data.length
    }
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const handleGenerate = async () => {
  if (!generateForm.productName) {
    ElMessage.warning('请输入产品名称')
    return
  }
  
  generating.value = true
  try {
    const res = await api.licenses.generate(generateForm)
    if (res.success) {
      generatedKey.value = res.data.licenseKey
      showGenerateDialog.value = false
      showResultDialog.value = true
      loadStats()
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } finally {
    generating.value = false
  }
}

const handleGenerateOffline = async () => {
  if (!offlineForm.licenseKey || !offlineForm.machineCode) {
    ElMessage.warning('请填写授权码和机器码')
    return
  }
  
  generatingOffline.value = true
  try {
    const res = await api.licenses.offline(offlineForm)
    if (res.success) {
      offlineContent.value = res.data
      showOfflineDialog.value = false
      showOfflineResultDialog.value = true
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } finally {
    generatingOffline.value = false
  }
}

const copyKey = () => {
  navigator.clipboard.writeText(generatedKey.value)
  ElMessage.success('已复制到剪贴板')
}

const downloadLicense = () => {
  const blob = new Blob([offlineContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `license_${Date.now()}.lic`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.quick-actions {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.result-content {
  padding: 10px 0;
}

.download-btn {
  margin-top: 16px;
  text-align: center;
}
</style>