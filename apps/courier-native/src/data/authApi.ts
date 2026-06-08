import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

export type LoginResult = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  role?: string
}

export type RefreshResult = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  role?: string
}

export type RegisterResult = {
  userId: string
  confirmationToken: string
  message: string
}

export async function loginWithBackend(params: {
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

export async function registerWithBackend(params: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  pushConsent?: boolean
  role?: string
}) {
  const trimmedPhone = params.phone?.trim()
  const payload: Record<string, unknown> = {
    email: params.email,
    password: params.password,
    firstName: params.firstName,
    lastName: params.lastName,
    pushConsent: params.pushConsent ?? false,
    role: params.role ?? 'COURIER',
  }

  if (trimmedPhone) {
    payload.phone = trimmedPhone
  }

  return apiRequest<ApiResponse<RegisterResult>>('/api/v1/auth/register', {
    method: 'POST',
    json: payload,
  })
}

export async function refreshSessionWithBackend(refreshToken: string) {
  return apiRequest<ApiResponse<RefreshResult>>('/api/v1/auth/refresh', {
    method: 'POST',
    json: { refreshToken },
  })
}

export async function logout(accessToken: string) {
  return apiRequest<ApiResponse<any>>('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function logoutAll(accessToken: string) {
  return apiRequest<ApiResponse<any>>('/api/v1/auth/logout-all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
