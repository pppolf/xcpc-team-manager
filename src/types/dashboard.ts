// src/types/dashboard.ts

// 1. 顶部统计卡片数据
export interface DashboardStats {
  totalMembers: number
  memberGrowth: number // 较上学期增长
  weeklyProblems: number
  weeklyGrowthRate: string // e.g. "12%"
  upcomingContestName: string
  upcomingContestDays: number
  averageRating: number
  maxRating: number
}

// 2. 折线图数据 (刷题趋势)
export interface TrendChartData {
  dates: string[]
  totalSubmissions: number[]
  acceptedSolutions: number[]
}

// 3. 饼图数据 (人员构成)
export interface CompositionChartData {
  name: string
  value: number
}

// 4. 公告数据
export interface Notice {
  id: number
  title: string
  content?: string
  author: string
  date: string
  type: 'primary' | 'success' | 'warning' | 'info'
}

// 5. 喜报数据
export interface Honor {
  id: number
  content: string
}

// 6. 聚合总接口
export interface DashboardData {
  stats: DashboardStats
  trendChart: TrendChartData
  compositionChart: CompositionChartData[]
  notices: Notice[]
  honors: Honor[]
}
