// src/api/index.ts
import http from '@/utils/http'
import type { User, UserParams } from '@/types/user'
import type { PageResult } from '@/types/api' // 引入刚才定义的类型

// 1. 获取成员列表
// 泛型指定为 User[]，那么返回值类型自动就是 Promise<User[]>
export const getMembersApi = (params?: UserParams) => {
  return http.get<PageResult<User>>('/users', params)
}

// 2. 登录接口
// 定义登录返回的数据结构 (包含 token)
interface LoginResponse {
  user: User
  token: string
}

export const loginApi = (username: string, password: string = '123456') => {
  return http.post<LoginResponse>('/users/login', { username, password })
}

// 3. 新增成员
export const addMemberApi = (user: User) => {
  return http.post<void>('/users', user)
}

// 4. 批量导入
export const batchAddMembersApi = (users: User[]) => {
  return http.post<void>('/users/batch', users)
}

// 5. 删除成员
export const deleteMemberApi = (studentId: string) => {
  return http.delete<void>(`/users/${studentId}`)
}

// 6. 更新成员
export const updateMemberApi = (id: string, user: Partial<User>) => {
  return http.put<User>(`/users/${id}`, user)
}
