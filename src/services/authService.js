import {
  isValidCourierCredentials,
  setCourierAuth,
  getCourierAuth,
  clearCourierAuth,
} from '../mock/auth'

export function signInWithCredentials(login, password) {
  if (!isValidCourierCredentials(login, password)) {
    return false
  }

  setCourierAuth(true)
  return true
}

export function isAuthorized() {
  return getCourierAuth()
}

export function signOut() {
  clearCourierAuth()
}
