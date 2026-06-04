export type RetirementStatus = 'Pending' | 'Approved' | 'Rejected'

export interface RetirementUser {
  _id: string
  realName: string
  studentId: string
  role: string
  status: string
  trainingTeam?: 'First' | 'Second' | string
  college?: string
  professional?: string
  grade?: string
  phone?: string
  email?: string
}

export interface RetirementRequest {
  _id: string
  userId: RetirementUser
  reason: string
  contact?: string
  status: RetirementStatus
  adminComment?: string
  handledBy?: {
    _id: string
    realName: string
    studentId: string
  }
  handledAt?: string
  createdAt: string
  updatedAt: string
}

export interface RetirementPage {
  list: RetirementRequest[]
  total: number
  page: number
  pageSize: number
}

export interface CreateRetirementParams {
  reason: string
  contact?: string
}
