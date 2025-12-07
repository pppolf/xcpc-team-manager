// src/api/mock.ts
import type { User } from '@/types/user'
import type { DashboardData } from '@/types/dashboard'

// --- 原有的 User 数据保持不变 ---
const mockUsers: User[] = [
  {
    id: 1,
    username: 'coach_li',
    realName: '李教练',
    role: 'Teacher',
    studentId: '001',
    status: 'Active',
  },
  {
    id: 2,
    username: 'cap_wang',
    realName: '王队长',
    role: 'Captain',
    memberType: 'Regular',
    studentId: '2021001',
    status: 'Active',
  },
  {
    id: 3,
    username: 'stu_zhang',
    realName: '张同学',
    role: 'Member',
    memberType: 'Star',
    studentId: '2022005',
    status: 'Active',
  },
  {
    id: 4,
    username: 'vice_lin',
    realName: '林副队',
    role: 'Vice-Captain',
    memberType: 'Regular',
    studentId: '2021002',
    status: 'Active',
  },
  // ... 你可以多加几条数据来测试表格分页
]

export const loginApi = (
  username: string,
): Promise<{ success: boolean; user?: User; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.username === username)
      if (user) resolve({ success: true, user, message: '登录成功' })
      else resolve({ success: false, message: '用户不存在' })
    }, 500)
  })
}

export const getMembersApi = (): Promise<User[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockUsers), 300))
}

// --- 新增：首页 Dashboard 数据 Mock ---
export const getDashboardDataApi = (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        // 1. 统计卡片
        stats: {
          totalMembers: 48,
          memberGrowth: 5,
          weeklyProblems: 1560,
          weeklyGrowthRate: '15%',
          upcomingContestName: 'ICPC 亚洲区域赛 (西安)',
          upcomingContestDays: 5,
          averageRating: 1620,
          maxRating: 2450,
        },
        // 2. 刷题趋势 (近7天)
        trendChart: {
          dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          totalSubmissions: [150, 230, 224, 218, 135, 347, 460], // 周末刷题多
          acceptedSolutions: [120, 180, 150, 170, 90, 280, 390],
        },
        // 3. 人员构成
        compositionChart: [
          { value: 40, name: '男生' },
          { value: 8, name: '女生' },
        ],
        // 4. 公告
        notices: [
          {
            id: 1,
            title: '寒假集训选拔赛通知',
            author: '李教练',
            date: '2023/12/01',
            type: 'primary',
          },
          {
            id: 2,
            title: '关于报销 ICPC 差旅费的说明',
            author: '财务处',
            date: '2023/11/28',
            type: 'warning',
          },
          {
            id: 3,
            title: '本周六模拟赛安排 (Codeforces)',
            author: '王队长',
            date: '2023/11/25',
            type: 'info',
          },
          {
            id: 4,
            title: '新购置算法书籍入库通知',
            author: '物资管理',
            date: '2023/11/20',
            type: 'success',
          },
        ],
        // 5. 喜报
        honors: [
          { id: 1, content: '🥇 祝贺 "Wrong Answer" 队在 ICPC 合肥站夺得金牌！' },
          { id: 2, content: '🥈 祝贺 "Runtime Error" 队在 CCPC 深圳站获得银牌。' },
          { id: 3, content: '🥉 恭喜张同学 Codeforces Rating 突破 2300 (Master)。' },
        ],
      })
    }, 600) // 模拟稍微慢一点的网络请求
  })
}
