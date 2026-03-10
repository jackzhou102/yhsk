<template>
  <div class="home-page">
    <div class="content-wrapper">
      <!-- 授权状态卡片 -->
      <el-card class="status-card" shadow="hover">
        <div class="status-header">
          <div class="status-icon" :class="licenseStore.statusType">
            <el-icon :size="48">
              <CircleCheck v-if="licenseStore.isVerified" />
              <Warning v-else />
            </el-icon>
          </div>
          <div class="status-info">
            <h2>{{ licenseStore.statusText }}</h2>
            <p v-if="licenseStore.licenseInfo">
              {{ licenseStore.licenseInfo.productName }} - 
              {{ getTypeName(licenseStore.licenseInfo.licenseType) }}
            </p>
            <p v-else>请进行授权验证</p>
          </div>
        </div>

        <el-divider />

        <!-- 授权详情 -->
        <div v-if="licenseStore.licenseInfo" class="license-details">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="授权码">
              <el-text type="primary" style="font-family: monospace;">
                {{ licenseStore.licenseInfo.licenseKey }}
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="授权类型">
              {{ getTypeName(licenseStore.licenseInfo.licenseType) }}
            </el-descriptions-item>
            <el-descriptions-item label="过期时间">
              <span :class="{ 'text-danger': licenseStore.licenseInfo.remainingDays <= 30 }">
                {{ formatDate(licenseStore.licenseInfo.expireAt) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="剩余天数">
              <el-tag :type="licenseStore.licenseInfo.remainingDays <= 30 ? 'warning' : 'success'">
                {{ licenseStore.licenseInfo.remainingDays }} 天
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="功能特性" :span="2">
              <el-tag v-for="f in licenseStore.licenseInfo.features" :key="f" style="margin-right: 4px;">
                {{ f }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 机器码 -->
        <div class="machine-code-section">
          <div class="machine-code-label">本机机器码：</div>
          <div class="machine-code-value">
            <el-text style="font-family: monospace; font-size: 16px;">
              {{ licenseStore.machineCode || '获取中...' }}
            </el-text>
            <el-button link type="primary" @click="copyMachineCode" style="margin-left: 8px;">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="$router.push('/online')">
          <el-icon><Connection /></el-icon>
          在线授权
        </el-button>
        <el-button type="success" size="large" @click="$router.push('/offline')">
          <el-icon><Document /></el-icon>
          离线授权
        </el-button>
        <el-button size="large" @click="refreshStatus">
          <el-icon><Refresh /></el-icon>
          刷新状态
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useLicenseStore } from '@/stores/license'
import dayjs from 'dayjs'

const licenseStore = useLicenseStore()

const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    trial: '试用版',
    professional: '专业版',
    enterprise: '企业版'
  }
  return map[type] || type
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const copyMachineCode = () => {
  if (licenseStore.machineCode) {
    navigator.clipboard.writeText(licenseStore.machineCode)
    ElMessage.success('已复制到剪贴板')
  }
}

const refreshStatus = () => {
  ElMessage.success('状态已刷新')
}

onMounted(async () => {
  // 获取机器码
  if (window.electronAPI) {
    const result = await window.electronAPI.getMachineId()
    if (result.success && result.data) {
      licenseStore.setMachineCode(result.data)
    }
  }
})
</script>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.content-wrapper {
  width: 100%;
  max-width: 600px;
}

.status-card {
  border-radius: 12px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.status-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.status-icon.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-icon.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.status-icon.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-info h2 {
  margin: 0;
  font-size: 24px;
  color: #1e293b;
}

.status-info p {
  margin: 8px 0 0;
  color: #64748b;
}

.license-details {
  margin-bottom: 20px;
}

.machine-code-section {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.machine-code-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.machine-code-value {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.text-danger {
  color: #ef4444;
}
</style>