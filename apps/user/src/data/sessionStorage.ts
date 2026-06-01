import AsyncStorage from '@react-native-async-storage/async-storage'

export type StoredUserSession = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  role: 'CLIENT'
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

const SESSION_STORAGE_KEY = 'swiftdeliver.user.session.v1'

function isStoredUserSession(value: unknown): value is StoredUserSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StoredUserSession>

  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.email === 'string' &&
    candidate.role === 'CLIENT'
  )
}

export async function loadStoredUserSession() {
  try {
    const rawValue = await AsyncStorage.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsedValue: unknown = JSON.parse(rawValue)
    return isStoredUserSession(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

export async function saveStoredUserSession(session: StoredUserSession) {
  try {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore local persistence errors and keep in-memory session alive.
  }
}

export async function clearStoredUserSession() {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Ignore local persistence errors during logout/cleanup.
  }
}
