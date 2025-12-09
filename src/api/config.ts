// src/api/config.ts
import http from '@/utils/http'

// 获取当前赛季
export const getSeasonApi = () => {
  return http.get<{ season: string }>('/config/season')
}

// 切换赛季 (危险操作)
export const setSeasonApi = (data: { season: string }) => {
  return http.post('/config/season', data)
}

// 强制全量结算 (调试用/补救用)
export const forceSettleApi = () => {
  return http.post('/config/forceSettle') // 假设你之前写了这个接口
}

// 修改密码
export const updatePasswordApi = (data: any) => {
  return http.post('/users/update-password', data) // 需要你在后端 User Controller 实现这个
}
