import type { Role } from '@/types/user'

// 角色转标签
export const formatRole = (role?: Role) => {
  if (!role) {
    return '未知'
  }
  const map: Record<Role, string> = {
    Teacher: '指导教师',
    Member: '队员',
    Captain: '队长',
    'Vice-Captain': '副队长',
    'Student-Coach': '学生教练',
  }
  return map[role] || role
}

// 格式化日期
export const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}
