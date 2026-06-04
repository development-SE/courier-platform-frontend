import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code?: string; message?: string }
}

export type DeviceRegistrationPayload = {
  deviceId: string
  platform: string
  provider: string
  pushToken: string
  appVersion?: string
  locale?: string
}

type DeviceRegistrationResponse = {
  success: boolean
  message: string
  data?: null
}

export type NotificationDeviceState = {
  deviceId: string
  pushToken: string
  provider: string
  enabled: boolean
}

export async function registerNotificationDevice(accessToken: string, payload: DeviceRegistrationPayload) {
  return apiRequest<ApiResponse<DeviceRegistrationResponse>>('/api/v1/notifications/devices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: payload,
  })
}

export async function setNotificationDeviceEnabled(accessToken: string, deviceId: string, enabled: boolean) {
  return apiRequest<ApiResponse<DeviceRegistrationResponse>>(
    `/api/v1/notifications/devices/${encodeURIComponent(deviceId)}/enabled`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      json: { enabled },
    },
  )
}

export async function unregisterNotificationDevice(accessToken: string, deviceId: string) {
  return apiRequest<ApiResponse<DeviceRegistrationResponse>>(
    `/api/v1/notifications/devices/${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}
