import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  timestamp?: string
}

export type CourierAssignmentResponse = {
  id: string
  orderId: string
  courierId: string
  assignmentStatus: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED' | 'FAILED'
  assignedAt: string
  etaMinutes?: number
  transportType?: string
}

export type PagedAssignmentsPayload = {
  content: CourierAssignmentResponse[]
  totalElements: number
  totalPages: number
  last: boolean
}

export type CourierLocationResponse = {
  courierId: string
  latitude: number
  longitude: number
  isOnline: boolean
  updatedAt: string
  transportType?: string
}

export async function getOrderAssignment(accessToken: string, orderId: string) {
  return apiRequest<ApiResponse<PagedAssignmentsPayload>>(`/api/v1/logistics/assignments?orderId=${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function getCourierLocation(accessToken: string, courierId: string) {
  return apiRequest<ApiResponse<CourierLocationResponse>>(`/api/v1/logistics/couriers/${courierId}/location`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

