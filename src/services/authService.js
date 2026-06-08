import { getStorageItem, removeStorageItem, setStorageItem } from '../platform/storage'

const GATEWAY = 'http://localhost:8080'
export const AUTH_STORAGE_KEY = 'swiftdeliver_courier_auth'

// Returns { accessToken, role } on success, throws on failure
export async function signInWithCredentials(email, password) {
  const res = await fetch(`${GATEWAY}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  let body
  try {
    body = await res.json()
  } catch {
    throw new Error('Сервер недоступен')
  }

  if (!res.ok) {
    throw new Error(body?.message || body?.error || 'Неверный email или пароль')
  }

  const session = body?.data ?? body
  if (!session?.accessToken) {
    throw new Error('Неверный email или пароль')
  }

  const { accessToken, refreshToken, role, expiresAt } = session
  setStorageItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, refreshToken, role, expiresAt }))
  return { accessToken, role }
}

export function isAuthorized() {
  const raw = getStorageItem(AUTH_STORAGE_KEY)
  if (!raw) return false
  try {
    const { accessToken } = JSON.parse(raw)
    return Boolean(accessToken)
  } catch {
    return false
  }
}

export function getSession() {
  const raw = getStorageItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function signOut() {
  removeStorageItem(AUTH_STORAGE_KEY)
}
