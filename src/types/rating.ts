// 定义排行榜单行数据接口
export interface RankItem {
  userId: string
  realName: string
  studentId: string
  college: string
  role: string
  total: number
  contest: number
  practice: number
  legacy: number
  coefficient: number
}

// 定义响应结构
export interface LeaderboardResponse {
  season: string
  isCurrent: boolean
  seasons: string[] // ['2023-2024', '2022-2023']
  list: RankItem[]
}
