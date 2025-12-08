// src/types/user.ts

// 1. 枚举类型
export type Gender = '男' | '女'
export type TShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'XXXXL'
export type Role = 'Teacher' | 'Captain' | 'Student-Coach' | 'Member'
export type Status = 'Active' | 'Retired'

// 2. 子对象接口
export interface OjInfo {
  cf?: string
  at?: string
  nc?: string // 虽然这里是 string，但对应数据库可能是 string 类型的 ID
  lg?: string
  cwnuoj?: string
}

export interface ratingInfo {
  contest?: number
  problem?: number
  legacy?: number
  activeCoefficier: number
}

// 3. 完整的用户接口 (对应数据库)
export interface User {
  _id?: string // 新增时没有 ID
  username: string // 必填
  password?: string // 前端不存明文，但表单需要
  realName: string // 必填
  college: string // 必填
  gender: Gender // 必填
  professional: string // 必填
  grade: string // 必填
  studentId: string // 必填
  phone: string // 必填
  idCard: string // 必填
  email: string // 必填
  tsize: TShirtSize // 必填
  role: Role // 必填
  status: Status // 必填

  // 以下新增时不需要填，有默认值
  ojInfo: OjInfo
  problemNumber: number
  rating: number
  ratingInfo?: ratingInfo
  lastMonthSolved?: number;
}

// 定义查询参数接口
export interface UserParams {
  page?: number;
  pageSize?: number;
  realName?: string;
  college?: string;
  grade?: string;
  gender?: string;
  role?: string;
  status?: string;
  studentId?: string;
  username?: string;
  [key: string]: string | number | undefined; // 允许索引访问
}

// 4. API 返回结构 (为了替代 any)
export interface ApiResponse<T = void> {
  success: boolean
  message?: string
  data?: T
}

export interface LoginResult {
  success: boolean
  user?: User
  message: string
}
