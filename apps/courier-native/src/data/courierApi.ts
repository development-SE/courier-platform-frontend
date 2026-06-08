import { apiRequest, getApiBaseUrl } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  errorCode?: string
  error?: { code?: string; message?: string }
}

export type DocumentType = 'IDENTIFICATION' | 'DRIVERS_LICENSE'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type CourierDocument = {
  id: string
  documentType: DocumentType
  documentNumber: string
  fileUrl?: string
  status: DocumentStatus
  rejectionReason?: string
  submittedAt?: string
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
  documents?: CourierDocument[]
  missingDocumentTypes?: DocumentType[]
  createdAt?: string
  updatedAt?: string
}

export function requiredDocuments(transportType?: string): DocumentType[] {
  if (transportType === 'CAR' || transportType === 'VAN') {
    return ['IDENTIFICATION', 'DRIVERS_LICENSE']
  }
  return ['IDENTIFICATION']
}

export type CreateCourierProfileRequest = {
  userId: string
  transportType?: string
  courierType?: string
  employmentStatus?: string
  canTakeOrders?: boolean
  maxActiveOrders?: number
  notes?: string
}

export type UpdateCourierProfileRequest = {
  transportType?: string
  courierType?: string
  employmentStatus?: string
  canTakeOrders?: boolean
  maxActiveOrders?: number
  notes?: string
}

export async function getMyCourierProfile(accessToken: string) {
  return apiRequest<ApiResponse<CourierProfile>>('/api/v1/couriers/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function createCourierProfile(accessToken: string, data: CreateCourierProfileRequest) {
  return apiRequest<ApiResponse<CourierProfile>>('/api/v1/couriers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: data,
  })
}

export async function updateCourierProfile(accessToken: string, id: string, data: UpdateCourierProfileRequest) {
  return apiRequest<ApiResponse<CourierProfile>>(`/api/v1/couriers/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: data,
  })
}

export async function uploadDocument(
  accessToken: string,
  type: DocumentType,
  documentNumber: string,
  imageUri: string,
): Promise<{ ok: true; data: ApiResponse<CourierProfile> } | { ok: false; error: { message: string } }> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/v1/couriers/me/documents`

  const formData = new FormData()
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `${type.toLowerCase()}.jpg`,
  } as unknown as Blob)
  formData.append('type', type)
  formData.append('documentNumber', documentNumber)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
    const payload = await response.json()
    if (!response.ok) {
      return {
        ok: false,
        error: { message: payload?.message || `Upload failed with status ${response.status}` },
      }
    }
    return { ok: true, data: payload as ApiResponse<CourierProfile> }
  } catch (error) {
    return {
      ok: false,
      error: { message: error instanceof Error ? error.message : 'Network error during upload' },
    }
  }
}
