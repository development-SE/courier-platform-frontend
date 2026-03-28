// utils/api.js
const BASE_URL = 'http://localhost:8080/api/v1'

const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || data?.message || 'Request failed')
  return data
}

export const api = {
  post: (path, body, token) => request('POST', path, body, token),
  get: (path, token) => request('GET', path, null, token),
  put: (path, body, token) => request('PUT', path, body, token),
  delete: (path, token) => request('DELETE', path, null, token),
}