import http from '@/utils/http'
import type {
  CreateRetirementParams,
  RetirementPage,
  RetirementStatus,
} from '@/types/retirement'

export const createRetirementApi = (data: CreateRetirementParams) => {
  return http.post<void>('/retirements/apply', data)
}

export const getRetirementsApi = (params?: {
  status?: RetirementStatus | 'All'
  scope?: 'me'
  page?: number
  pageSize?: number
}) => {
  return http.get<RetirementPage>('/retirements', params)
}

export const handleRetirementApi = (
  id: string,
  action: 'approve' | 'reject',
  comment?: string,
) => {
  return http.post<void>(`/retirements/handle/${id}`, { action, comment })
}
