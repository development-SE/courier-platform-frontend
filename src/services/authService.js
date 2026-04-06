import { createLocalCredentialsAuthUseCases } from '@core/use-cases/auth/localCredentialsAuth'
import { AUTH_CREDENTIALS, AUTH_STORAGE_KEY } from '../mock/auth'
import { getStorageItem, removeStorageItem, setStorageItem } from '../platform/storage'

const authUseCases = createLocalCredentialsAuthUseCases({
  storage: {
    getItem: (key, scope) => getStorageItem(key, scope),
    setItem: (key, value, scope) => setStorageItem(key, value, scope),
    removeItem: (key, scope) => removeStorageItem(key, scope),
  },
  credentials: AUTH_CREDENTIALS,
  storageKey: AUTH_STORAGE_KEY,
})

export function signInWithCredentials(login, password) {
  return authUseCases.signInWithCredentials(login, password)
}

export function isAuthorized() {
  return authUseCases.isAuthorized()
}

export function signOut() {
  authUseCases.signOut()
}
