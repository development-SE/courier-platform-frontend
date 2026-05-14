import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

export type UserRole = 'CLIENT'

export type LoginResult = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  role?: string
}

export type RefreshResult = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type RegisterResult = {
  userId: string
  confirmationToken: string
  message: string
}

export async function loginUser(params: {
  email: string
  password: string
  deviceId?: string
}) {
  return apiRequest<ApiResponse<LoginResult>>('/api/v1/auth/login', {
    method: 'POST',
    json: {
      email: params.email,
      password: params.password,
      deviceId: params.deviceId ?? '',
    },
  })
}

export async function registerUser(params: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}) {
  const trimmedPhone = params.phone?.trim()
  const payload: Record<string, unknown> = {
    email: params.email,
    password: params.password,
    firstName: params.firstName,
    lastName: params.lastName,
    pushConsent: false,
    role: 'CLIENT' satisfies UserRole,
  }

  if (trimmedPhone) {
    payload.phone = trimmedPhone
  }

  return apiRequest<ApiResponse<RegisterResult>>('/api/v1/auth/register', {
    method: 'POST',
    json: payload,
  })
}

export async function refreshUserSession(refreshToken: string) {
  return apiRequest<ApiResponse<RefreshResult>>('/api/v1/auth/refresh', {
    method: 'POST',
    json: { refreshToken },
  })
}
