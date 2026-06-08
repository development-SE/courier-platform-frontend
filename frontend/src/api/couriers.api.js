import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const couriersApi = {
  async getByUserId(userId) {
    // CourierProfile.id === userId (profile uses userId as PK)
    const response = await api.get(`/couriers/${userId}`, token())
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

  async verifyDocument(courierId, documentId, { status, rejectionReason = '' }) {
    const body = { status }
    if (rejectionReason) body.rejectionReason = rejectionReason
    const response = await api.put(`/couriers/${courierId}/documents/${documentId}/verify`, body, token())
    return unwrap(response)
  },

  async update(courierId, body) {
    const response = await api.put(`/couriers/${courierId}`, body, token())
    return unwrap(response)
  },

  async createEmployee({ firstName, lastName, phone, email, password, transportType }) {
    const t = token()

    // Step 1: create auth user with role=COURIER (auto-verified by backend for staff-created accounts)
    const authRes = await api.post('/auth/staff', {
      firstName,
      lastName,
      phone: phone || undefined,
      email,
      password,
      role: 'COURIER',
    }, t)

    if (!authRes.success) {
      const msg = authRes.error?.message || authRes.message || 'Failed to create user account'
      throw new Error(msg)
    }

    const userId = authRes.data?.userId
    if (!userId) throw new Error('No userId returned from account creation')

    // Step 2: create courier profile as EMPLOYEE
    const profileRes = await api.post('/couriers', {
      userId,
      courierType: 'EMPLOYEE',
      employmentStatus: 'ACTIVE',
      transportType,
      isVerified: true,
      canTakeOrders: true,
      maxActiveOrders: 5,
      schedules: [
        { weekday: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00', timezone: 'Asia/Almaty', active: true },
        { weekday: 'TUESDAY', startTime: '09:00:00', endTime: '18:00:00', timezone: 'Asia/Almaty', active: true },
        { weekday: 'WEDNESDAY', startTime: '09:00:00', endTime: '18:00:00', timezone: 'Asia/Almaty', active: true },
        { weekday: 'THURSDAY', startTime: '09:00:00', endTime: '18:00:00', timezone: 'Asia/Almaty', active: true },
        { weekday: 'FRIDAY', startTime: '09:00:00', endTime: '18:00:00', timezone: 'Asia/Almaty', active: true },
      ],
    }, t)

    return unwrap(profileRes)
  },
}
