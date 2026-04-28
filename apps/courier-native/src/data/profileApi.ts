import { apiRequest } from './apiClient'

type BackendApiResponse<T> = {
  success: boolean
  data: T
  errorCode?: string
  message?: string
}

export type UserProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  companyId?: string | null
  role: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CourierSchedule = {
  id?: number | null
  weekday: string
  startTime: string
  endTime: string
  timezone: string
  active: boolean
}

export type CourierProfile = {
  id?: string | null
  userId: string
  companyId?: string | null
  courierType?: 'CONTRACTOR' | 'EMPLOYEE' | null
  employmentStatus?: 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | null
  transportType?: 'FOOT' | 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN' | null
  isVerified: boolean
  canTakeOrders: boolean
  maxActiveOrders: number
  notes?: string | null
  schedules: CourierSchedule[]
  createdAt?: string | null
  updatedAt?: string | null
}

export async function fetchMyProfile(accessToken: string) {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function fetchMyCourierProfile(accessToken: string) {
  const result = await apiRequest<BackendApiResponse<CourierProfile>>('/api/v1/couriers/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!result.ok) {
    return result
  }

  if (!result.data.success || !result.data.data) {
    return {
      ok: false as const,
      error: { message: result.data.message ?? 'Failed to load courier profile' },
    }
  }

  return { ok: true as const, data: result.data.data }
}