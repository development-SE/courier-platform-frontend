import { apiClient } from './apiClient'

// PUT /api/v1/logistics/couriers/me/location
export async function updateMyLocation(latitude, longitude, isOnline = true) {
  const res = await apiClient.put('/api/v1/logistics/couriers/me/location', {
    latitude,
    longitude,
    isOnline,
  })
  return res.data ?? res
}

// PATCH /api/v1/logistics/couriers/me/online
export async function setOnlineStatus(isOnline) {
  const res = await apiClient.patch('/api/v1/logistics/couriers/me/online', { isOnline })
  return res.data ?? res
}
