const memoryStorage = new Map()

function getWebStorage(scope) {
  if (typeof window === 'undefined') return null
  return scope === 'session' ? window.sessionStorage : window.localStorage
}

function toScopedKey(scope, key) {
  return `${scope}:${key}`
}

export function getStorageItem(key, scope = 'local') {
  const storage = getWebStorage(scope)
  if (storage) {
    try {
      return storage.getItem(key)
    } catch {
      // Continue with in-memory fallback.
    }
  }

  return memoryStorage.get(toScopedKey(scope, key)) ?? null
}

export function setStorageItem(key, value, scope = 'local') {
  const stringValue = String(value)
  const storage = getWebStorage(scope)

  if (storage) {
    try {
      storage.setItem(key, stringValue)
      return
    } catch {
      // Continue with in-memory fallback.
    }
  }

  memoryStorage.set(toScopedKey(scope, key), stringValue)
}

export function removeStorageItem(key, scope = 'local') {
  const storage = getWebStorage(scope)
  if (storage) {
    try {
      storage.removeItem(key)
    } catch {
      // Continue with in-memory fallback.
    }
  }

  memoryStorage.delete(toScopedKey(scope, key))
}
