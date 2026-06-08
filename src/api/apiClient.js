const GATEWAY = 'http://localhost:8080'
const TOKEN_KEY = 'swiftdeliver_courier_auth'

function getToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw).accessToken || null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${GATEWAY}${path}`, { ...options, headers })

  let body
  try {
    body = await res.json()
  } catch {
    body = {}
  }

  if (!res.ok) {
    const err = new Error(body?.message || body?.error || `HTTP ${res.status}`)
    err.status = res.status
    err.code = body?.errorCode || body?.code
    throw err
  }

  return body
}

export const apiClient = {
  get:   (path, opts = {})       => request(path, { method: 'GET', ...opts }),
  post:  (path, data, opts = {}) => request(path, { method: 'POST',  body: JSON.stringify(data), ...opts }),
  put:   (path, data, opts = {}) => request(path, { method: 'PUT',   body: JSON.stringify(data), ...opts }),
  patch: (path, data, opts = {}) => request(path, { method: 'PATCH', body: JSON.stringify(data), ...opts }),
}

export const GATEWAY_URL = GATEWAY
