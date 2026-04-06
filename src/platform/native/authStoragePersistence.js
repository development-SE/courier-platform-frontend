import { getStorageItem, removeStorageItem, setStorageItem } from '../storage'

const SECURE_STORE_CANDIDATE = 'expo-secure-store'
const ASYNC_STORAGE_CANDIDATE = '@react-native-async-storage/async-storage'

let backendPromise = null

async function resolveBackend() {
  try {
    const secureStore = await import(SECURE_STORE_CANDIDATE)
    if (typeof secureStore.getItemAsync === 'function') {
      return {
        type: 'secure-store',
        async getItem(key) {
          return secureStore.getItemAsync(key)
        },
        async setItem(key, value) {
          return secureStore.setItemAsync(key, value)
        },
        async removeItem(key) {
          return secureStore.deleteItemAsync(key)
        },
      }
    }
  } catch {
    // SecureStore package is optional.
  }

  try {
    const asyncStorageModule = await import(ASYNC_STORAGE_CANDIDATE)
    const asyncStorage = asyncStorageModule.default ?? asyncStorageModule
    if (typeof asyncStorage.getItem === 'function') {
      return {
        type: 'async-storage',
        async getItem(key) {
          return asyncStorage.getItem(key)
        },
        async setItem(key, value) {
          return asyncStorage.setItem(key, value)
        },
        async removeItem(key) {
          return asyncStorage.removeItem(key)
        },
      }
    }
  } catch {
    // AsyncStorage package is optional.
  }

  return null
}

async function getBackend() {
  if (!backendPromise) {
    backendPromise = resolveBackend()
  }
  return backendPromise
}

export async function hydrateAuthStateFromNativeStorage(storageKey) {
  const backend = await getBackend()
  if (!backend) return false

  try {
    const value = await backend.getItem(storageKey)
    if (value == null) {
      removeStorageItem(storageKey, 'local')
      return true
    }

    setStorageItem(storageKey, value, 'local')
    return true
  } catch {
    return false
  }
}

export async function persistAuthStateToNativeStorage(storageKey) {
  const backend = await getBackend()
  if (!backend) return false

  try {
    const value = getStorageItem(storageKey, 'local')
    if (value == null) {
      await backend.removeItem(storageKey)
      return true
    }

    await backend.setItem(storageKey, value)
    return true
  } catch {
    return false
  }
}

export async function getNativeAuthStorageBackendType() {
  const backend = await getBackend()
  return backend?.type ?? null
}
