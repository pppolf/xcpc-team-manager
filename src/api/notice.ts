import http from '@/utils/http'
import { type Notice, type UploadResponse } from '@/types/notice'

// 2. 文件上传 API (通用)
// 用于编辑器插图和附件上传
export const uploadImgApi = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await http.post<UploadResponse>('/notices/attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.list[0]
}

export const uploadApi = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  // 注意：这里调用的是我们之前写的附件上传接口，支持多格式
  const res = await http.post<UploadResponse>('/notices/attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.list[0]
}

// 3. 业务接口

// 获取公开列表
export const getPublicNoticeListApi = (params: {
  page: number
  pageSize: number
  keyword?: string
}) => {
  return http.get<{ list: Notice[]; total: number }>('/notices/list', params)
}

// 获取详情 (公开)
export const getNoticeDetailApi = (nid: string | number) => {
  return http.get<Notice>(`/notices/view/${nid}`)
}

// 获取管理列表 (管理员)
export const getAdminNoticeListApi = (params: {
  page: number
  pageSize: number
  status?: string
}) => {
  return http.get<{ list: Notice[]; total: number }>('/notices/admin/list', params)
}

// 获取单条详情 (管理员编辑用，根据 _id)
export const getNoticeByIdApi = (id: string) => {
  return http.get<Notice>(`/notices/admin/${id}`)
}

// 创建公告
export const createNoticeApi = (data: Partial<Notice>) => {
  return http.post<Notice>('/notices', data)
}

// 更新公告
export const updateNoticeApi = (id: string, data: Partial<Notice>) => {
  return http.put<Notice>(`/notices/${id}`, data)
}

// 删除公告
export const deleteNoticeApi = (id: string) => {
  return http.delete(`/notices/${id}`)
}
