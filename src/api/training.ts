import http from '@/utils/http'

export interface Training {
  _id: string
  title: string
  type: 'TRAINING' | 'ASSESSMENT'
  platform: 'VJUDGE' | 'LOCAL'
  vjudgeContestId: string
  problemCount: number
  targetCount: number
  startTime: string
  duration: number
  ranklist: any[]
}

export const getTrainingListApi = () => http.get<Training[]>('/training')
export const getTrainingDetailApi = (id: string) => http.get<Training>(`/training/${id}`)
export const createTrainingApi = (data: any) => http.post('/training', data)
export const refreshTrainingApi = (id: string) => http.post<Training>(`/training/${id}/refresh`)
export const deleteTrainingApi = (id: string) => http.delete(`/training/${id}`)
export const updateTrainingApi = (id: string, data: any) => http.put(`/training/${id}`, data)
export const importTrainingDataApi = (id: string, content: string) =>
  http.post<Training>(`/training/${id}/import`, { content })
