import { apiRequest } from './apiClient'

export type AddressResponse = {
  id: string
  userId: string
  label: string
  city: string
  street: string
  house: string
  apartment?: string
  entrance?: string
  floor?: string
  latitude: number
  longitude: number
  defaultAddress: boolean
  createdAt: string
  updatedAt: string
}

export type AddressPageResponse = {
  content: AddressResponse[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type CreateAddressRequest = {
  label?: string
  city: string
  street: string
  house: string
  apartment?: string
  entrance?: string
  floor?: string
  latitude: number
  longitude: number
  defaultAddress?: boolean
}

export function listAddresses(accessToken: string, page = 1, size = 20) {
  return apiRequest<AddressPageResponse>(`/api/v1/users/me/addresses?page=${page}&size=${size}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createAddress(accessToken: string, data: CreateAddressRequest) {
  return apiRequest<AddressResponse>('/api/v1/users/me/addresses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: data,
  })
}

export function updateAddress(accessToken: string, id: string, data: CreateAddressRequest) {
  return apiRequest<AddressResponse>(`/api/v1/users/me/addresses/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    json: data,
  })
}

export function deleteAddress(accessToken: string, id: string) {
  return apiRequest<null>(`/api/v1/users/me/addresses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function setDefaultAddress(accessToken: string, id: string) {
  return apiRequest<AddressResponse>(`/api/v1/users/me/addresses/${id}/default`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

