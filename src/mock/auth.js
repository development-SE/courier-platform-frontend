import { getStorageItem, removeStorageItem, setStorageItem } from '../platform/storage'

export const AUTH_STORAGE_KEY = 'swiftdeliver_courier_auth'

export const AUTH_CREDENTIALS = [
  {
    login: 'courier',
    password: '123456',
  },
  {
    login: 'courier@example.com',
    password: '123456',
  },
]

export function isValidCourierCredentials(login, password) {
  return AUTH_CREDENTIALS.some(
    user => user.login.toLowerCase() === String(login).trim().toLowerCase() && user.password === password,
  )
}

export function setCourierAuth(isAuthorized) {
  setStorageItem(AUTH_STORAGE_KEY, isAuthorized ? '1' : '0')
}

export function getCourierAuth() {
  return getStorageItem(AUTH_STORAGE_KEY) === '1'
}

export function clearCourierAuth() {
  removeStorageItem(AUTH_STORAGE_KEY, 'local')
  removeStorageItem(AUTH_STORAGE_KEY, 'session')
}
