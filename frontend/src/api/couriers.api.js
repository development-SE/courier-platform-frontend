import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const couriersApi = {
  async getByUserId(userId) {
    const response = await api.get(`/couriers/by-user/${userId}`, token())
    return unwrap(response)
  },

  async getEligibility(courierId, at = '') {
    const query = at ? `?at=${encodeURIComponent(at)}` : ''
    const response = await api.get(`/couriers/${courierId}/eligibility${query}`, token())
    return unwrap(response)
  },

  async list({ companyId = '', page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams()
    if (companyId) params.append('companyId', companyId)
    params.append('page', page - 1)  // Spring is 0-indexed
    params.append('size', pageSize)

    const response = await api.get(`/couriers?${params.toString()}`, token())
    const data = unwrap(response)
    return {
        items: data.content || [],
        total: data.totalElements || 0,
    }
  },
}
