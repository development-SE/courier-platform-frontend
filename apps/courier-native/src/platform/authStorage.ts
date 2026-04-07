import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AUTH_KEY = 'swiftdeliver_courier_auth'
const AUTH_TOKENS_KEY = 'swiftdeliver_courier_tokens'

async function readFromSecureStore(key: string) {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function writeToSecureStore(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value)
    return true
  } catch {
    return false
  }
}

async function removeFromSecureStore(key: string) {
  try {
    await SecureStore.deleteItemAsync(key)
    return true
  } catch {
    return false
  }
}

export async function readAuthorizedState() {
  const secureValue = await readFromSecureStore(AUTH_KEY)
  if (secureValue != null) return secureValue === '1'

  try {
    const asyncValue = await AsyncStorage.getItem(AUTH_KEY)
    return asyncValue === '1'
  } catch {
    return false
  }
}

export async function persistAuthorizedState(authorized: boolean) {
  const serialized = authorized ? '1' : '0'
  const secureSuccess = await writeToSecureStore(AUTH_KEY, serialized)
  if (secureSuccess) return

  try {
    await AsyncStorage.setItem(AUTH_KEY, serialized)
  } catch {
    // no-op
  }
}

export async function clearAuthorizedState() {
  const secureSuccess = await removeFromSecureStore(AUTH_KEY)
  if (secureSuccess) return

  try {
    await AsyncStorage.removeItem(AUTH_KEY)
  } catch {
    // no-op
  }
}

export async function readAuthTokens() {
  const secureValue = await readFromSecureStore(AUTH_TOKENS_KEY)
  if (secureValue != null) {
    try {
      return JSON.parse(secureValue) as { accessToken?: string; refreshToken?: string } | null
    } catch {
      return null
    }
  }

  try {
    const asyncValue = await AsyncStorage.getItem(AUTH_TOKENS_KEY)
    return asyncValue ? JSON.parse(asyncValue) as { accessToken?: string; refreshToken?: string } : null
  } catch {
    return null
  }
}

export async function persistAuthTokens(tokens: { accessToken?: string; refreshToken?: string }) {
  const serialized = JSON.stringify(tokens ?? {})
  const secureSuccess = await writeToSecureStore(AUTH_TOKENS_KEY, serialized)
  if (secureSuccess) return

  try {
    await AsyncStorage.setItem(AUTH_TOKENS_KEY, serialized)
  } catch {
    // no-op
  }
}

export async function clearAuthTokens() {
  const secureSuccess = await removeFromSecureStore(AUTH_TOKENS_KEY)
  if (secureSuccess) return

  try {
    await AsyncStorage.removeItem(AUTH_TOKENS_KEY)
  } catch {
    // no-op
  }
}
