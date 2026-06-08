import { apiClient } from './apiClient'

export async function fetchOrderById(orderId) {
  const res = await apiClient.get(`/api/v1/orders/${orderId}`)
  return res.data ?? res
}

// GET /api/v1/orders?page=1&size=20&status=ASSIGNED
export async function fetchOrders({ status, page = 1, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size })
  if (status) params.append('status', status)
  const res = await apiClient.get(`/api/v1/orders?${params}`)
  // response: { data: { content: [...], totalItems, ... } } or { data: [...] }
  const payload = res.data ?? res
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.orders)) return payload.orders
  return []
}

// PATCH /api/v1/orders/{orderId}/status
// status: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
export async function updateOrderStatus(orderId, status) {
  const res = await apiClient.patch(`/api/v1/orders/${orderId}/status`, { status })
  return res.data ?? res
}
