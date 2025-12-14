// 1. 获取到的工单详情
export interface Ticket {
  _id: string
  userId: {
    _id: string
    realName: string
    studentId: string
  }
  contestName: string
  season: string
  type: string
  awardLevel?: string

  // 🟢 新增：支持排名和总人数
  rank?: number
  totalParticipants?: number

  proofUrl: string
  description?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  adminComment?: string
  createdAt: string
}

export interface PageTicket {
  list: Ticket[],
  total?: number
  page?: number
  pageSize?: number
}

// 2. 提交工单的参数
export interface CreateTicketParams {
  contestName: string
  season: string
  type: string
  awardLevel?: string

  // 🟢 新增：支持排名和总人数
  rank?: number
  totalParticipants?: number

  proofUrl: string
  description?: string
}
