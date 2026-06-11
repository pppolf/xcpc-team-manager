import http from '@/utils/http'

export interface MonthlyStat {
  _id: { year: number; month: number }
  count: number
  avgDifficulty: number
}

export interface StatsData {
  total: number
  last7Days: number
  last30Days: number
  thisYear: number
  difficultyStats: Record<string, number>
  calendarHeatmap: Record<string, { count: number; problems: any[] }>
  calendarMaxDiff: Record<string, number>
  monthlyStats: MonthlyStat[]
  activityStats: any
}

export interface SubmissionParams {
  page: number
  size: number
  userId?: string
  source?: string
  keyword?: string
}

export interface SubmissionItem {
  platform: string
  problemId: string
  remoteId: string
  title: string
  link: string
  solveTime: string
  difficulty: number
  rawDifficulty: string
}

export interface TableData {
  list: SubmissionItem[]
  total: number
}

export interface DashboardStats {
  total: number
  last7Days: number
  last30Days: number
  thisYear: number
  // ... 其他图表数据类型
}

export const getChartDataApi = (period: string, userId?: string) => {
  return http.get<StatsData>('/stats/charts', { period, ...(userId && { userId }) })
}

// 获取表格数据
export const getSubmissionListApi = (params: SubmissionParams) =>
  http.get<TableData>('/stats/records', { ...params })

// 同步数据
export const syncDataApi = (client_id?: string) =>
  http.post<{ message: string }>('/submissions/sync', { client_id })
