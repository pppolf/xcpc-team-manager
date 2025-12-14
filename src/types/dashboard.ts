// 1. 枚举类型
export type Gender = '男' | '女'
export type Role = 'Teacher' | 'Captain' | 'Student-Coach' | 'Member' | 'Vice-Captain'
export type Status = 'Active' | 'Retired'

// 2. 首页用户信息接口
export interface IUser {
  _id?: string
  username: string
  realName: string
  college: string
  gender: Gender
  professional: string
  grade: string
  role: Role
  status: Status
  problemNumber: number
  rating: number
}