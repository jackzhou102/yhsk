import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 通用请求方法
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config)
  return response.data
}

// API 接口
export const api = {
  // 授权相关
  licenses: {
    list: () => request<any>({ url: '/license/list', method: 'GET' }),
    get: (id: string) => request<any>({ url: `/license/${id}`, method: 'GET' }),
    generate: (data: any) => request<any>({ url: '/license/generate', method: 'POST', data }),
    revoke: (id: string) => request<any>({ url: `/license/revoke/${id}`, method: 'POST' }),
    delete: (id: string) => request<any>({ url: `/license/${id}`, method: 'DELETE' }),
    offline: (data: any) => request<any>({ url: '/license/offline', method: 'POST', data })
  },
  
  // 客户相关
  customers: {
    list: () => request<any>({ url: '/customer/list', method: 'GET' }),
    get: (id: string) => request<any>({ url: `/customer/${id}`, method: 'GET' }),
    create: (data: any) => request<any>({ url: '/customer/create', method: 'POST', data }),
    update: (id: string, data: any) => request<any>({ url: `/customer/${id}`, method: 'PUT', data }),
    delete: (id: string) => request<any>({ url: `/customer/${id}`, method: 'DELETE' })
  },
  
  // 日志相关
  logs: {
    list: (limit: number = 100) => request<any>({ url: `/logs/list?limit=${limit}`, method: 'GET' })
  }
}

export default api