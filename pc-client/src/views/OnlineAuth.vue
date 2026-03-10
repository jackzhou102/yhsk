<template>
  <div class="online-auth-page">
    <div class="content-wrapper">
      <el-card class="auth-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24"><Connection /></el-icon>
            <span>在线授权验证</span>
          </div>
        </template>

        <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
          <el-form-item label="机器码">
            <el-input v-model="licenseStore.machineCode" disabled>
              <template #append>
                <el-button @click="copyMachineCode">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="授权码" prop="licenseKey">
            <el-input 
              v-model="form.licenseKey" 
              placeholder="请输入授权码 (XXXX-XXXX-XXXX-XXXX)"
              style="font-family: monospace;"
            />
          </el-form-item>

          <el-form-item label="设备名称">
            <el-input v-model="form.deviceName" placeholder="可选，用于标识设备" />
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
              <el-descriptions-item label="剩余天数">
                <el-tag type="success">{{ verifyResult.remainingDays }} 天</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="过期时间">
                {{ formatDate(verifyResult.license.expireAt) }}
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
            <span>使用说明</span>
          </div>
        </template>
        <ol class="help-list">
          <li>复制本机机器码，发送给管理员获取授权码</li>
          <li>输入管理员提供的授权码</li>
          <li>点击"验证授权"完成在线授权</li>
          <li>授权成功后即可使用软件全部功能</li>
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
const verifyResult = ref<any>(null)

const form = reactive({
  licenseKey: '',
  deviceName: ''
})

const rules: FormRules = {
  licenseKey: [
    { required: true, message: '请输入授权码', trigger: 'blur' },
    { pattern: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, message: '授权码格式不正确', trigger: 'blur' }
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

const copyMachineCode = () => {
  if (licenseStore.machineCode) {
    navigator.clipboard.writeText(licenseStore.machineCode)
    ElMessage.success('已复制到剪贴板')
  }
}

const handleVerify = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (!licenseStore.machineCode) {
      ElMessage.error('无法获取机器码')
      return
    }

    verifying.value = true
    try {
      const res = await authApi.verify({
        licenseKey: form.licenseKey,
        machineCode: licenseStore.machineCode,
        deviceName: form.deviceName || 'Unknown'
      })

      const data = res.data
      verifyResult.value = data

      if (data.valid && data.license) {
        // 保存授权信息
        licenseStore.setLicenseInfo({
          licenseKey: data.license.licenseKey,
          productName: data.license.productName,
          licenseType: data.license.licenseType,
          features: data.license.features,
          expireAt: data.license.expireAt,
          status: 'valid',
          remainingDays: data.remainingDays || 0
        })

        ElMessage.success('授权验证成功！')
        
        // 3秒后返回首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
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

.verify-result {
  margin-top: 20px;
}

.success-info {
  margin-top: 16px;
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