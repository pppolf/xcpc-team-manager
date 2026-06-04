import http from '@/utils/http'

export const getSeasonApi = () => {
  return http.get<{ season: string }>('/config/season')
}

export const setSeasonApi = (data: { season: string }) => {
  return http.post('/config/season', data)
}

export const forceSettleApi = () => {
  return http.post('/config/forceSettle')
}

export const recalculateRatingsApi = () => {
  return http.post('/config/recalculateRatings')
}

export const updatePasswordApi = (data: { oldPassword: string; newPassword: string }) => {
  return http.post('/users/update-password', data)
}

export const resetUserPasswordApi = (data: { userId: string; newPassword: string }) => {
  return http.post('/users/reset-password', data)
}

export const getAtCoderCookie = () => {
  return http.get<string>('/config/atcoder_cookie')
}

export const setAtCoderCookie = (cookieValue: string) => {
  return http.post('/config/atcoder_cookie', {
    cookieValue,
  })
}
