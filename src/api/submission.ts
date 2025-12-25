import http from '@/utils/http'

// 定义 OJ 账号信息的接口 (假设从用户信息里取)
export interface OJInfo {
  cf?: string
  at?: string
  lg?: string
  nc?: string
  cwnuoj?: string
  vjudge?: string
}

// 1. 同步 AtCoder
export const syncAtCoderApi = (username: string) => http.get(`/submissions/atcoder/${username}`)

// 2. 同步 CodeForces
export const syncCodeForcesApi = (username: string) =>
  http.get(`/submissions/codeforces/${username}`)

// 3. 同步 Luogu (支持传 client_id)
export const syncLuoguApi = (username: string, client_id?: string) =>
  http.get(`/submissions/luogu/${username}`, {
    params: { client_id }, // 将 client_id 作为 query 参数传递
  })

// 4. 同步 NowCoder
export const syncNowCoderApi = (userId: string) => http.get(`/submissions/nowcoder/${userId}`)
