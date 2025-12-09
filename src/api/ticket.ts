import http from '@/utils/http'
import type { Ticket, CreateTicketParams } from '@/types/ticket'

// 提交工单
export const createTicketApi = (data: CreateTicketParams) => {
  return http.post<Ticket>('/tickets/apply', data)
}

// 获取工单列表 (支持筛选状态)
export const getTicketsApi = (params?: { status?: string }) => {
  return http.get<Ticket[]>('/tickets', params)
}

// 获取我的工单记录
export const getMyTicketsApi = () => {
  // 复用列表接口，后端会根据角色自动过滤
  return http.get<Ticket[]>('/tickets')
}

// 审批工单
export const handleTicketApi = (id: string, action: 'approve' | 'reject', comment?: string) => {
  return http.post<void>(`/tickets/handle/${id}`, { action, comment })
}
