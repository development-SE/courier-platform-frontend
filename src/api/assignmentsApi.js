import { apiClient } from './apiClient'

// Poll for assignments in ASSIGNED/PENDING status (backend auto-filters to current courier)
export async function fetchMyPendingAssignment(status = 'ASSIGNED') {
  const params = new URLSearchParams({ status, pageSize: 1, page: 1 })
  const res = await apiClient.get(`/api/v1/logistics/assignments?${params}`)
  const payload = res.data ?? res
  const content = Array.isArray(payload.content) ? payload.content : []
  return content[0] ?? null
}

export async function acceptAssignment(assignmentId) {
  const res = await apiClient.post(`/api/v1/logistics/assignments/${assignmentId}/accept`)
  return res.data ?? res
}

export async function rejectAssignment(assignmentId, reason = 'courier_skipped') {
  const res = await apiClient.post(`/api/v1/logistics/assignments/${assignmentId}/reject`, { reason })
  return res.data ?? res
}
