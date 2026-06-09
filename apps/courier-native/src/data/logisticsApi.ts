import { apiRequest } from './apiClient'

export type AssignmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'

export type AssignmentResponse = {
  id: string
  orderId: string
  courierId: string
  assignedBy?: string
  assignmentStatus: AssignmentStatus
  assignedAt: string
  acceptedAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  cancelledAt?: string
  etaMinutes?: number
  actualDurationMinutes?: number
  rejectionReason?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export type PagedAssignments = {
  content: AssignmentResponse[]
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type CourierLocationResponse = {
  courierId: string
  latitude: number
  longitude: number
  isOnline: boolean
  updatedAt: string
}

export type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

/**
 * Toggles the logged-in courier's online status.
 */
export async function toggleOnlineStatus(accessToken: string, isOnline: boolean) {
  return apiRequest<ApiResponse<CourierLocationResponse>>('/api/v1/logistics/couriers/me/online', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      isOnline,
    },
  })
}

/**
 * Updates the logged-in courier's GPS location and online status.
 */
export async function updateGPSLocation(
  accessToken: string,
  latitude: number,
  longitude: number,
  isOnline: boolean,
) {
  return apiRequest<ApiResponse<CourierLocationResponse>>('/api/v1/logistics/couriers/me/location', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      latitude,
      longitude,
      isOnline,
    },
  })
}

/**
 * Retrieves the logged-in courier's current assignments (e.g. ASSIGNED, ACCEPTED, etc.).
 */
export async function listMyAssignments(
  accessToken: string,
  courierId: string,
  status?: AssignmentStatus,
  page: number = 1,
  pageSize: number = 20,
) {
  let path = `/api/v1/logistics/assignments?=${courierId}&page=${page}&pageSize=${pageSize}`
  if (status) {courierId
    path += `&status=${status}`
  }
  return apiRequest<ApiResponse<PagedAssignments>>(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Updates assignment status (e.g. from ASSIGNED to ACCEPTED, PICKED_UP, etc.).
 */
export async function updateAssignmentStatus(
  accessToken: string,
  assignmentId: string,
  newStatus: AssignmentStatus,
  changedBy?: string,
  reason?: string,
) {
  if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
    throw new Error(`PATCH /status cannot be used for ${newStatus}. Use acceptAssignment or rejectAssignment instead.`)
  }
  return apiRequest<ApiResponse<AssignmentResponse>>(`/api/v1/logistics/assignments/${assignmentId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      newStatus,
      changedBy,
      reason: reason || 'status transition',
    },
  })
}

/**
 * Verifies the customer's delivery OTP code to complete the delivery.
 */
export async function verifyDeliveryCode(
  accessToken: string,
  assignmentId: string,
  confirmationCode: string,
) {
  return apiRequest<ApiResponse<AssignmentResponse>>(
    `/api/v1/logistics/assignments/${assignmentId}/verify-delivery-code`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      json: {
        confirmationCode,
      },
    },
  )
}

export type OrderResponse = {
  orderId: string
  status: string
  serviceType: string
  comment?: string
  totalAmount: number
  pickupAddress?: {
    street?: string
    city?: string
    house?: string
    apartment?: string
    entrance?: string
    floor?: string
    latitude?: number
    longitude?: number
  }
  deliveryAddress?: {
    street?: string
    city?: string
    house?: string
    apartment?: string
    entrance?: string
    floor?: string
    latitude?: number
    longitude?: number
  }
  recipientInfo?: {
    contactId?: string
    name?: string
    surname?: string
    phone?: string
  }
  pickupInfo?: {
    contactId?: string
    name?: string
    surname?: string
    phone?: string
  }
  deliveryConfirmationCode?: string
  items?: {
    itemId?: string
    name?: string
    quantity: number
    price?: number
  }[]
}

/**
 * Fetches real order details from the backend order-service via gateway.
 */
export async function getOrderDetails(accessToken: string, orderId: string) {
  return apiRequest<ApiResponse<OrderResponse>>(`/api/v1/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Accepts a pending assignment.
 */
export async function acceptAssignment(accessToken: string, assignmentId: string) {
  return apiRequest<ApiResponse<AssignmentResponse>>(`/api/v1/logistics/assignments/${assignmentId}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Rejects a pending assignment.
 */
export async function rejectAssignment(accessToken: string, assignmentId: string, reason?: string) {
  return apiRequest<ApiResponse<AssignmentResponse>>(`/api/v1/logistics/assignments/${assignmentId}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: reason ? { reason } : undefined,
  })
}

/**
 * Retrieves assignment status by ID.
 */
export async function getAssignment(accessToken: string, assignmentId: string) {
  return apiRequest<ApiResponse<AssignmentResponse>>(`/api/v1/logistics/assignments/${assignmentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Resends the current delivery OTP or regenerates it after expiration.
 */
export async function resendDeliveryCode(
  accessToken: string,
  assignmentId: string,
) {
  return apiRequest<ApiResponse<any>>(
    `/api/v1/logistics/assignments/${assignmentId}/resend-delivery-code`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
}

