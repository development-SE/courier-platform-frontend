import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code?: string; message?: string }
}

export type AuthProfile = {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  isEmailVerified?: boolean
  createdAt?: number
}

export async function getAuthProfile(accessToken: string) {
  return apiRequest<ApiResponse<AuthProfile>>('/api/v1/auth/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
