import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface LicenseInfo {
  licenseKey: string
  productName: string
  licenseType: string
  features: string[]
  expireAt: string
  status: 'valid' | 'expired' | 'invalid'
  remainingDays: number
}

export const useLicenseStore = defineStore('license', () => {
  const licenseInfo = ref<LicenseInfo | null>(null)
  const machineCode = ref('')
  const isVerified = ref(false)

  const statusText = computed(() => {
    if (!licenseInfo.value) return '未授权'
    switch (licenseInfo.value.status) {
      case 'valid': return '已授权'
      case 'expired': return '已过期'
      case 'invalid': return '无效授权'
      default: return '未授权'
    }
  })

  const statusType = computed(() => {
    if (!licenseInfo.value) return 'danger'
    switch (licenseInfo.value.status) {
      case 'valid': return 'success'
      case 'expired': return 'warning'
      case 'invalid': return 'danger'
      default: return 'info'
    }
  })

  const setLicenseInfo = (info: LicenseInfo | null) => {
    licenseInfo.value = info
    isVerified.value = info?.status === 'valid'
  }

  const setMachineCode = (code: string) => {
    machineCode.value = code
  }

  const clearLicense = () => {
    licenseInfo.value = null
    isVerified.value = false
  }

  return {
    licenseInfo,
    machineCode,
    isVerified,
    statusText,
    statusType,
    setLicenseInfo,
    setMachineCode,
    clearLicense
  }
})