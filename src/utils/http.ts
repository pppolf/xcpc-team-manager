// src/utils/http.ts
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

// 1. 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api', // 后端地址
  timeout: 10000, // 超时时间
  headers: { 'Content-Type': 'application/json' },
})

// 2. 请求拦截器 (Request Interceptor)
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 或 Pinia 获取 Token
    const token = localStorage.getItem('token')

    if (token && config.headers) {
      // 按照 JWT 标准，添加 Bearer 头
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 3. 响应拦截器 (Response Interceptor)
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 这里的 response.data 就是后端返回的 JSON: { success, code, message, data }
    const res = response.data

    // 判断业务状态码 (假设 code === 200 为成功)
    if (res.code === 200 || res.success) {
      return res.data // ✅ 核心：直接返回 data，剥离外层包装
    } else {
      // 业务逻辑错误 (如密码错误)
      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error) => {
    // HTTP 状态码错误处理 (4xx, 5xx)
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          // Token 过期或未登录
          ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
          }).then(() => {
            localStorage.removeItem('token') // 清除 token
            router.push('/login') // 跳转登录
          })
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求资源未找到')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(response.data.message || '网络错误')
      }
    } else {
      ElMessage.error('网络连接超时或断开')
    }
    return Promise.reject(error)
  },
)

// 4. 导出封装好的类型化请求方法
const http = {
  get<T>(url: string, params?: object): Promise<T> {
    return service.get(url, { params })
  },

  post<T>(url: string, data?: object, timeout?: object): Promise<T> {
    return service.post(url, data, timeout)
  },

  put<T>(url: string, data?: object): Promise<T> {
    return service.put(url, data)
  },

  delete<T>(url: string, params?: object): Promise<T> {
    return service.delete(url, { params })
  },

  // 也可以暴露原始 axios 实例以备不时之需
  instance: service,
}

export default http
