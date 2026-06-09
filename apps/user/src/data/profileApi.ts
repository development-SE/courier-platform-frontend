import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

export type UserProfile = {
  userId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: string
  isEmailVerified: boolean
  createdAt: number
}

export async function getUserProfile(accessToken: string) {
  return apiRequest<ApiResponse<UserProfile>>('/api/v1/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function updateUserProfile(
  accessToken: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  },
) {
  return apiRequest<ApiResponse<string>>('/api/v1/auth/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: data,
  })
}

export async function changePassword(
  accessToken: string,
  oldPassword: string,
  newPassword: string,
) {
  return apiRequest<ApiResponse<string>>('/api/v1/auth/change-password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: { oldPassword, newPassword },
  })
}
