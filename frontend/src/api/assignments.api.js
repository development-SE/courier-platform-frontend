import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()
const unwrap = (res) => res?.data ?? res

export const assignmentsApi = {
  async list({ courierId, orderId, status, page = 1, pageSize = 20, sortBy = 'assignedAt', desc = true } = {}) {
    const params = new URLSearchParams()
    if (courierId) params.append('courierId', courierId)
    if (orderId)   params.append('orderId', orderId)
    if (status)    params.append('status', status)
    params.append('page', page)
    params.append('pageSize', pageSize)
    params.append('sortBy', sortBy)
    params.append('desc', desc)
    const res = await api.get(`/logistics/assignments?${params.toString()}`, token())
    const data = unwrap(res)
    return { items: data.content || [], total: data.totalItems || 0, totalPages: data.totalPages || 0 }
  },

  async listManualRequired({ page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams()
    params.append('page', page)
    params.append('pageSize', pageSize)
    const res = await api.get(`/logistics/assignments/manual-required?${params.toString()}`, token())
    const data = unwrap(res)
    return { items: data.content || [], total: data.totalItems || 0 }
  },

  // legacy alias
  async manualRequired(args) {
    return this.listManualRequired(args)
  },

  async autoAssign(orderId) {
    const res = await api.post(`/logistics/assignments/auto/${orderId}`, {}, token())
    return unwrap(res)
  },

  async manualAssign({ orderId, courierId, reason }) {
    const res = await api.post('/logistics/assignments/manual', { orderId, courierId, reason }, token())
    return unwrap(res)
  },

  async getById(id) {
    const res = await api.get(`/logistics/assignments/${id}`, token())
    return unwrap(res)
  },

  async updateStatus(id, status, reason = '') {
    const payload = typeof status === 'object'
      ? { newStatus: status.newStatus, reason: status.reason || '' }
      : { newStatus: status, reason }
    const res = await api.patch(`/logistics/assignments/${id}/status`, payload, token())
    return unwrap(res)
  },

  async accept(id) {
    const res = await api.post(`/logistics/assignments/${id}/accept`, {}, token())
    return unwrap(res)
  },

  async reject(id, reason = '') {
    const res = await api.post(`/logistics/assignments/${id}/reject`, { reason }, token())
    return unwrap(res)
  },

  async verifyDeliveryCode(id, code) {
    const res = await api.post(`/logistics/assignments/${id}/verify-delivery-code`, { confirmationCode: code }, token())
    return unwrap(res)
  },

  async resendDeliveryCode(id) {
    const res = await api.post(`/logistics/assignments/${id}/resend-delivery-code`, {}, token())
    return unwrap(res)
  },

  async getHistory(id) {
    const res = await api.get(`/logistics/assignments/${id}/history`, token())
    const data = unwrap(res)
    return Array.isArray(data) ? data : []
  },

  async retryManualRequired() {
    const res = await api.post('/logistics/assignments/manual-required/retry', {}, token())
    return unwrap(res)
  },
}
