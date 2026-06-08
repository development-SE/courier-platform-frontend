import { apiClient } from './apiClient'

// GET /api/v1/couriers/me  →  { data: CourierProfileResponse }
export async function fetchMyCourierProfile() {
  const res = await apiClient.get('/api/v1/couriers/me')
  return res.data ?? res
}
