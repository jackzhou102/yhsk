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

  // 生成授权文件
  generateLicenseFile: (data: { licenseKey: string; machineCode: string }) =>
    apiClient.post('/auth/generate-license-file', data),

  // 获取授权详情
  getLicense: (id: string) =>
    apiClient.get(`/license/${id}`)
}

export default authApi