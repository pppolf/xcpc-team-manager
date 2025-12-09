// src/api/index.ts
import http from '@/utils/http'
import type { User, UserParams } from '@/types/user'
import type { CrawlerBatchResult, PageResult, ContestsParam, RefreshTarget } from '@/types/api' // 引入刚才定义的类型
import type { LeaderboardResponse } from '@/types/rating'

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

export const getUserProfileApi = () => {
  return http.get<User>('/users/profile')
}

export const getUserDetailApi = (id: string) => {
  return http.get<User>(`/users/${id}`);
};

// === 比赛/奖项 API ===

// 录入比赛记录
export const addContestRecordApi = (data: ContestsParam) => {
  return http.post<void>('/contests', data)
}

// 获取某人的比赛记录
export const getUserContestRecordsApi = (userId: string) => {
  return http.get(`/contests/user/${userId}`)
}

// 删除比赛记录
export const deleteContestRecordApi = (id: string) => {
  return http.delete<void>(`/contests/${id}`)
}

// === 爬虫 API ===

// 刷新刷题数
export const refreshUserSolvedApi = (userId: string) => {
  // 返回结构对应后端 CrawlerController 的 result
  return http.post<{ previous: number; current: number; increment: number }>('/crawler/refresh', {
    userId,
  })
}

// 刷新全队刷题数
export const refreshAllMembersApi = () => {
  // 注意：这个请求可能会很慢（假设30人 * 2秒 = 60秒），需要前端 axios timeout 设置得足够长
  // 或者后端改成异步任务，这里我们暂时同步等待
  return http.post<CrawlerBatchResult>('/crawler/refresh-all', {}, { timeout: 150000 }) // 设置 2分钟超时
}

// 获取刷新目标列表
export const getRefreshTargetsApi = () => {
  return http.get<RefreshTarget[]>('/crawler/targets')
}

// ========排行榜=======
// 获取排行榜
export const getLeaderboardApi = (season?: string) => {
  return http.get<LeaderboardResponse>('/rating/leaderboard', { season })
}
