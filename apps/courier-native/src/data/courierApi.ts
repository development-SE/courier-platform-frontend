import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  errorCode?: string
  error?: { code?: string; message?: string }
}

export type CourierSchedule = {
  id?: number
  weekday: string
  startTime: string
  endTime: string
  timezone: string
  active: boolean
}

export type CourierProfile = {
  id: string
  companyId?: string
  courierType?: string
  employmentStatus?: string
  transportType?: string
  isVerified: boolean
  canTakeOrders: boolean
  maxActiveOrders: number
  notes?: string
  schedules?: CourierSchedule[]
  createdAt?: string
  updatedAt?: string
}

export async function getMyCourierProfile(accessToken: string) {
  return apiRequest<ApiResponse<CourierProfile>>('/api/v1/couriers/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
