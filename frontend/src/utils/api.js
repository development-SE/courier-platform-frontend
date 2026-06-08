// utils/api.js
export const BASE_URL = 'http://localhost:8080/api/v1'

const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = res.status === 403
      ? 'У вас недостаточно прав'
      : data?.error?.message || data?.message || 'Request failed'
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return data
}

export const api = {
  post: (path, body, token) => request('POST', path, body, token),
  get: (path, token) => request('GET', path, null, token),
  put: (path, body, token) => request('PUT', path, body, token),
  patch: (path, body, token) => request('PATCH', path, body, token),
  delete: (path, token) => request('DELETE', path, null, token),
}
