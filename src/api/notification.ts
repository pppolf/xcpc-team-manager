import http from '@/utils/http'

export interface NotificationItem {
  _id: string
  title: string
  content: string
  type: 'success' | 'warning' | 'info' | 'error'
  isRead: boolean
  createdAt: string
}

export const getNotificationsApi = () => {
  return http.get<{ list: NotificationItem[]; unreadCount: number }>('/notifications')
}

export const markReadApi = (id: string) => {
  return http.put(`notifications/read/${id}`)
}

export const markAllReadApi = () => {
  return http.put(`notifications/read-all`)
}