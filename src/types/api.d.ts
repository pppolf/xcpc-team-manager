// src/types/api.d.ts

// 1. 通用 API 响应结构 (与后端约定一致)
export interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
}

// 2. 分页响应结构
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface CrawlerBatchResult {
  total: number
  successCount: number
  failCount: number
  details: object
}

export interface ContestsParam {
  userId: string
  type: string
  name: string
  season: string
  awardLevel?: string
  rank?: number
  totalParticipants?: number
}

// 定义简单的用户摘要类型
export interface RefreshTarget {
  _id: string;
  realName: string;
  studentId: string;
}