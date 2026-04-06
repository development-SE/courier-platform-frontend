import { createCredentialsAdapter } from '../../contracts/credentialsAdapter'
import { STORAGE_SCOPE, createStorageAdapter } from '../../contracts/storageAdapter'

function normalizeCredentials(rawCredentials) {
  return rawCredentials
    .map(item => ({
      login: String(item?.login ?? '').trim().toLowerCase(),
      password: String(item?.password ?? ''),
    }))
    .filter(item => item.login.length > 0 && item.password.length > 0)
}

export function createLocalCredentialsAuthUseCases({
  storage,
  credentials,
  storageKey = 'auth_state',
  authValue = '1',
} = {}) {
  const storageAdapter = createStorageAdapter(storage)
  const credentialsAdapter = createCredentialsAdapter({
    listCredentials: () => credentials,
  })

  const normalizedCredentials = normalizeCredentials(credentialsAdapter.listCredentials())

  function isValidCredentials(login, password) {
    const normalizedLogin = String(login ?? '').trim().toLowerCase()
    const normalizedPassword = String(password ?? '')

    return normalizedCredentials.some(item => (
      item.login === normalizedLogin && item.password === normalizedPassword
    ))
  }

  function signInWithCredentials(login, password) {
    if (!isValidCredentials(login, password)) {
      return false
    }

    storageAdapter.setItem(storageKey, authValue, STORAGE_SCOPE.LOCAL)
    return true
  }

  function isAuthorized() {
    return storageAdapter.getItem(storageKey, STORAGE_SCOPE.LOCAL) === authValue
  }

  function signOut() {
    storageAdapter.removeItem(storageKey, STORAGE_SCOPE.LOCAL)
    storageAdapter.removeItem(storageKey, STORAGE_SCOPE.SESSION)
  }

  return {
    isValidCredentials,
    signInWithCredentials,
    isAuthorized,
    signOut,
  }
}
