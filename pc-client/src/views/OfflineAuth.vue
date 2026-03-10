<template>
  <div class="offline-auth-page">
    <div class="content-wrapper">
      <el-card class="auth-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24"><Document /></el-icon>
            <span>离线授权验证</span>
          </div>
        </template>

        <!-- 步骤指示 -->
        <el-steps :active="currentStep" finish-status="success" simple style="margin-bottom: 24px;">
          <el-step title="获取机器码" />
          <el-step title="导入授权文件" />
          <el-step title="验证完成" />
        </el-steps>

        <!-- 步骤1: 机器码 -->
        <div v-show="currentStep === 0" class="step-content">
          <el-alert
            title="请将以下机器码发送给管理员，获取离线授权文件"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-form label-width="100px">
            <el-form-item label="本机机器码">
              <el-input v-model="licenseStore.machineCode" disabled>
                <template #append>
                  <el-button @click="copyMachineCode">复制</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>

          <div class="step-actions">
            <el-button @click="$router.push('/')">返回</el-button>
            <el-button type="primary" @click="currentStep = 1">
              下一步
            </el-button>
          </div>
        </div>

        <!-- 步骤2: 导入授权文件 -->
        <div v-show="currentStep === 1" class="step-content">
          <el-upload
            ref="uploadRef"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".lic"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
          >
            <el-icon class="el-icon--upload" :size="48"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将授权文件拖到此处，或<em>点击选择</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .lic 格式的授权文件
              </div>
            </template>
          </el-upload>

          <div v-if="selectedFile" class="file-info">
            <el-tag type="success">
              <el-icon><Document /></el-icon>
              {{ selectedFile.name }}
            </el-tag>
          </div>

          <div class="step-actions">
            <el-button @click="currentStep = 0">上一步</el-button>
            <el-button type="primary" @click="handleVerify" :loading="verifying" :disabled="!selectedFile">
              验证授权
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 验证结果 -->
        <div v-show="currentStep === 2" class="step-content">
          <el-result
            :icon="verifySuccess ? 'success' : 'error'"
            :title="verifySuccess ? '授权验证成功' : '授权验证失败'"
            :sub-title="verifyMessage"
          >
            <template #extra>
              <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
              <el-button @click="resetAuth">重新授权</el-button>
            </template>
          </el-result>

          <div v-if="verifySuccess && licenseInfo" class="license-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="授权码">
                <el-text type="primary" style="font-family: monospace;">
                  {{ licenseInfo.licenseKey }}
                </el-text>
              </el-descriptions-item>
              <el-descriptions-item label="产品名称">
                {{ licenseInfo.product }}
              </el-descriptions-item>
              <el-descriptions-item label="授权类型">
                {{ getTypeName(licenseInfo.type) }}
              </el-descriptions-item>
              <el-descriptions-item label="过期时间">
                {{ formatDate(licenseInfo.expireAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="功能特性" :span="2">
                <el-tag v-for="f in licenseInfo.features" :key="f" style="margin-right: 4px;">
                  {{ f }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>

      <!-- 使用说明 -->
      <el-card class="help-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="20"><QuestionFilled /></el-icon>
            <span>离线授权说明</span>
          </div>
        </template>
        <ol class="help-list">
          <li>复制本机机器码，发送给管理员</li>
          <li>管理员使用机器码生成离线授权文件 (.lic)</li>
          <li>将授权文件导入本工具进行验证</li>
          <li>验证成功后即可离线使用软件</li>
        </ol>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, type UploadInstance, type UploadProps, type UploadUserFile } from 'element-plus'
import { useLicenseStore } from '@/stores/license'
import { offlineAuth } from '@/api'
import dayjs from 'dayjs'

const licenseStore = useLicenseStore()

const currentStep = ref(0)
const uploadRef = ref<UploadInstance>()
const selectedFile = ref<File | null>(null)
const verifying = ref(false)
const verifySuccess = ref(false)
const verifyMessage = ref('')
const licenseInfo = ref<any>(null)

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

const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  selectedFile.value = uploadFile.raw || null
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('只能上传一个授权文件')
}

const handleVerify = async () => {
  if (!selectedFile.value || !licenseStore.machineCode) {
    ElMessage.error('请选择授权文件')
    return
  }

  verifying.value = true
  try {
    // 读取文件内容
    const content = await selectedFile.value.text()
    
    // 解析授权文件
    const parseResult = await offlineAuth.parseLicenseFile(content)
    if (!parseResult.success) {
      verifySuccess.value = false
      verifyMessage.value = parseResult.message || '授权文件格式错误'
      currentStep.value = 2
      return
    }

    // 验证签名和机器码
    const verifyResult = offlineAuth.verifySignature(parseResult.data, licenseStore.machineCode)
    
    verifySuccess.value = verifyResult.valid
    verifyMessage.value = verifyResult.message
    
    if (verifyResult.valid && parseResult.data) {
      licenseInfo.value = parseResult.data
      
      // 计算剩余天数
      const expireAt = new Date(parseResult.data.expireAt)
      const now = new Date()
      const remainingDays = Math.ceil((expireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      // 保存授权信息
      licenseStore.setLicenseInfo({
        licenseKey: parseResult.data.licenseKey,
        productName: parseResult.data.product,
        licenseType: parseResult.data.type,
        features: parseResult.data.features,
        expireAt: parseResult.data.expireAt,
        status: 'valid',
        remainingDays
      })
    }
    
    currentStep.value = 2
  } catch (error: any) {
    verifySuccess.value = false
    verifyMessage.value = error.message || '验证失败'
    currentStep.value = 2
  } finally {
    verifying.value = false
  }
}

const resetAuth = () => {
  currentStep.value = 0
  selectedFile.value = null
  verifySuccess.value = false
  verifyMessage.value = ''
  licenseInfo.value = null
  uploadRef.value?.clearFiles()
}

onMounted(async () => {
  // 确保机器码已获取
  if (!licenseStore.machineCode && window.electronAPI) {
    const result = await window.electronAPI.getMachineId()
    if (result.success && result.data) {
      licenseStore.setMachineCode(result.data)
    }
  }
})
</script>

<style scoped>
.offline-auth-page {
  height: 100%;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 600px;
}

.auth-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.step-content {
  min-height: 200px;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.file-info {
  margin-top: 16px;
  text-align: center;
}

.license-info {
  margin-top: 20px;
}

.help-card {
  border-radius: 12px;
}

.help-list {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  line-height: 2;
}
</style>