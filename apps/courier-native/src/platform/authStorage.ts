import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AUTH_KEY = 'swiftdeliver_courier_auth'

async function readFromSecureStore() {
  try {
    return await SecureStore.getItemAsync(AUTH_KEY)
  } catch {
    return null
  }
}

async function writeToSecureStore(value: string) {
  try {
    await SecureStore.setItemAsync(AUTH_KEY, value)
    return true
  } catch {
    return false
  }
}

async function removeFromSecureStore() {
  try {
    await SecureStore.deleteItemAsync(AUTH_KEY)
    return true
  } catch {
    return false
  }
}

export async function readAuthorizedState() {
  const secureValue = await readFromSecureStore()
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
  const secureSuccess = await writeToSecureStore(serialized)
  if (secureSuccess) return

  try {
    await AsyncStorage.setItem(AUTH_KEY, serialized)
  } catch {
    // no-op
  }
}

export async function clearAuthorizedState() {
  const secureSuccess = await removeFromSecureStore()
  if (secureSuccess) return

  try {
    await AsyncStorage.removeItem(AUTH_KEY)
  } catch {
    // no-op
  }
}
