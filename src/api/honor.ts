import http from '@/utils/http'

export interface Attachment {
  name: string
  url: string
}

export interface UploadResponse {
  list: {
    name: string
    url: string
    size: number
  }[]
}

export interface Honor {
  _id: string
  hid: number
  title: string
  content: string
  coverImage: string // 🟢 封面图
  eventDate: string // 🟢 获奖日期
  authorName: string
  status: 'DRAFT' | 'PUBLISHED'
  views: number
  attachments: Attachment[]
  createdAt: string
}

// 1. 获取公开列表 (卡片墙)
export const getPublicHonorListApi = (params: { page: number; pageSize: number }) => {
  return http.get<{ list: Honor[]; total: number }>('/honors/list', params)
}

// 2. 获取详情
export const getHonorDetailApi = (hid: string | number) => {
  return http.get<Honor>(`/honors/view/${hid}`)
}

// 3. 管理列表 (管理员)
export const getAdminHonorListApi = (params: {
  page: number
  pageSize: number
  status?: string
}) => {
  return http.get<{ list: Honor[]; total: number }>('/honors/admin/list', params)
}

// 4. 获取单条 (编辑回显)
export const getHonorByIdApi = (id: string) => {
  return http.get<Honor>(`/honors/admin/${id}`)
}

// 5. 创建
export const createHonorApi = (data: Partial<Honor>) => {
  return http.post<Honor>('/honors', data)
}

// 6. 更新
export const updateHonorApi = (id: string, data: Partial<Honor>) => {
  return http.put<Honor>(`/honors/${id}`, data)
}

// 7. 删除
export const deleteHonorApi = (id: string) => {
  return http.delete(`/honors/${id}`)
}

// 8. 上传封面
export const uploadApi = async (file: File) => {
    const formData = new FormData()
  formData.append('file', file)
  // 注意：这里调用的是我们之前写的附件上传接口，支持多格式
  const res = await http.post<UploadResponse>('/honors/attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.list[0]
}