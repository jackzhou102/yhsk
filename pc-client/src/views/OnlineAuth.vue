<template>
  <div class="online-auth-page">
    <div class="content-wrapper">
      <el-card class="auth-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24"><Connection /></el-icon>
            <span>授权验证</span>
          </div>
        </template>

        <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
          <el-form-item label="机器码" prop="machineCode">
            <el-input
              v-model="form.machineCode"
              placeholder="请输入机器码或使用本机机器码"
              style="font-family: monospace;"
            >
              <template #append>
                <el-button @click="useLocalMachineCode" :disabled="!licenseStore.machineCode">
                  使用本机
                </el-button>
              </template>
            </el-input>
            <div class="form-tip">可输入其他机器的机器码，为其生成授权文件</div>
          </el-form-item>

          <el-form-item label="授权码" prop="licenseKey">
            <el-input
              v-model="form.licenseKey"
              placeholder="请输入授权码 (XXXX-XXXX-XXXX-XXXX)"
              style="font-family: monospace;"
            />
          </el-form-item>

          <el-form-item label="设备名称" prop="deviceName">
            <el-input v-model="form.deviceName" placeholder="请输入设备名称，用于标识设备" />
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button @click="$router.push('/')">返回</el-button>
          <el-button type="primary" @click="handleVerify" :loading="verifying">
            验证授权
          </el-button>
        </div>

        <!-- 验证结果 -->
        <div v-if="verifyResult" class="verify-result">
          <el-divider />
          <el-alert
            :title="verifyResult.valid ? '授权验证成功' : '授权验证失败'"
            :type="verifyResult.valid ? 'success' : 'error'"
            :description="verifyResult.message"
            show-icon
            :closable="false"
          />

          <div v-if="verifyResult.valid && verifyResult.license" class="success-info">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="产品名称">
                {{ verifyResult.license.productName }}
              </el-descriptions-item>
              <el-descriptions-item label="授权类型">
                {{ getTypeName(verifyResult.license.licenseType) }}
              </el-descriptions-item>
              <el-descriptions-item label="设备使用">
                <el-tag type="primary">{{ verifyResult.activeDeviceCount }} / {{ verifyResult.maxDevices }} 台</el-tag>
                <span style="margin-left: 8px; color: #909399; font-size: 12px;">
                  (剩余 {{ verifyResult.remainingDevices }} 台)
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="剩余天数">
                <el-tag type="success">{{ verifyResult.remainingDays }} 天</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="过期时间" :span="2">
                {{ formatDate(verifyResult.license.expireAt) }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="download-section">
              <el-button type="primary" size="large" @click="downloadLicenseFile" :loading="downloading">
                <el-icon><Download /></el-icon>
                下载授权文件 (.lic)
              </el-button>
              <p class="download-tip">请将授权文件复制到目标软件的授权目录中使用</p>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 使用说明 -->
      <el-card class="help-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="20"><QuestionFilled /></el-icon>
            <span>使用说明</span>
          </div>
        </template>
        <ol class="help-list">
          <li>获取目标机器的机器码（可使用本机机器码或其他机器码）</li>
          <li>输入管理员提供的授权码</li>
          <li>点击"验证授权"完成授权验证</li>
          <li>验证成功后下载授权文件 (.lic)</li>
          <li>将授权文件复制到目标软件的授权目录中</li>
        </ol>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useLicenseStore } from '@/stores/license'
import authApi from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const licenseStore = useLicenseStore()

const formRef = ref<FormInstance>()
const verifying = ref(false)
const downloading = ref(false)
const verifyResult = ref<any>(null)

const form = reactive({
  machineCode: '',
  licenseKey: '',
  deviceName: ''
})

const rules: FormRules = {
  machineCode: [
    { required: true, message: '请输入机器码', trigger: 'blur' }
  ],
  licenseKey: [
    { required: true, message: '请输入授权码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, message: '授权码格式不正确', trigger: 'blur' }
  ],
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ]
}

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

const useLocalMachineCode = () => {
  if (licenseStore.machineCode) {
    form.machineCode = licenseStore.machineCode
  }
}

const handleVerify = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    verifying.value = true
    try {
      const res = await authApi.verify({
        licenseKey: form.licenseKey,
        machineCode: form.machineCode,
        deviceName: form.deviceName
      })

      const result = res.data
      verifyResult.value = result.data || { valid: false, message: result.message || '验证失败' }

      if (result.success && result.data?.valid && result.data.license) {
        // 如果使用的是本机机器码，保存授权信息
        if (form.machineCode === licenseStore.machineCode) {
          licenseStore.setLicenseInfo({
            licenseKey: result.data.license.licenseKey,
            productName: result.data.license.productName,
            licenseType: result.data.license.licenseType,
            features: result.data.license.features,
            expireAt: result.data.license.expireAt,
            status: 'valid',
            remainingDays: result.data.remainingDays || 0
          })
        }

        ElMessage.success('授权验证成功！请下载授权文件')
      }
    } catch (error) {
      verifyResult.value = {
        valid: false,
        message: '网络请求失败，请检查网络连接'
      }
    } finally {
      verifying.value = false
    }
  })
}

const downloadLicenseFile = async () => {
  if (!form.licenseKey || !form.machineCode) {
    ElMessage.error('缺少必要参数')
    return
  }

  downloading.value = true
  try {
    const res = await authApi.generateLicenseFile({
      licenseKey: form.licenseKey,
      machineCode: form.machineCode
    })

    if (res.data.success && res.data.data) {
      const content = res.data.data
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `license_${form.licenseKey.replace(/-/g, '')}.lic`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('授权文件已下载')
    } else {
      ElMessage.error(res.data.message || '生成授权文件失败')
    }
  } catch (error) {
    ElMessage.error('生成授权文件失败')
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  // 获取本机机器码
  if (!licenseStore.machineCode && window.electronAPI) {
    const result = await window.electronAPI.getMachineId()
    if (result.success && result.data) {
      licenseStore.setMachineCode(result.data)
    }
  }
  // 默认使用本机机器码
  if (licenseStore.machineCode) {
    form.machineCode = licenseStore.machineCode
  }
})
</script>

<style scoped>
.online-auth-page {
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.verify-result {
  margin-top: 20px;
}

.success-info {
  margin-top: 16px;
}

.download-section {
  margin-top: 24px;
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.download-tip {
  margin-top: 12px;
  color: #64748b;
  font-size: 13px;
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