// src/types/user.ts

// 角色枚举
export type UserRole = 'Teacher' | 'Captain' | 'Vice-Captain' | 'Student-Coach' | 'Member'

// 队员类型
export type MemberType = 'Regular' | 'Star'

// 用户接口定义
export interface User {
  id: number
  username: string
  realName: string
  role: UserRole
  memberType?: MemberType // 只有队员才有这个属性
  studentId: string
  status: 'Active' | 'Retired'
}
