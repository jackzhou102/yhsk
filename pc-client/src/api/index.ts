import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus'

// API 客户端
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 授权 API
export const authApi = {
  // 在线验证
  verify: (data: { licenseKey: string; machineCode: string; deviceName: string }) => 
    apiClient.post('/auth/verify', data),
  
  // 获取授权详情
  getLicense: (id: string) => 
    apiClient.get(`/license/${id}`)
}

// 离线授权验证
export const offlineAuth = {
  // 解析授权文件
  parseLicenseFile: async (content: string) => {
    try {
      // Base64 解码
      const decoded = atob(content)
      const licenseData = JSON.parse(decoded)
      return { success: true, data: licenseData }
    } catch (error: any) {
      return { success: false, message: '授权文件格式错误' }
    }
  },
  
  // 验证签名
  verifySignature: (licenseData: any, machineCode: string) => {
    // 检查机器码
    if (licenseData.machineCode !== machineCode) {
      return { valid: false, message: '机器码不匹配' }
    }
    
    // 检查过期时间
    const expireAt = new Date(licenseData.expireAt)
    if (expireAt < new Date()) {
      return { valid: false, message: '授权已过期' }
    }
    
    return { valid: true, data: licenseData }
  }
}

export default authApi