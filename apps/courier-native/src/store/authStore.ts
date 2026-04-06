import { create } from 'zustand'
import { clearAuthorizedState, persistAuthorizedState, readAuthorizedState } from '../platform/authStorage'

type AuthStatus = 'loading' | 'ready'

type AuthState = {
  status: AuthStatus
  authorized: boolean
  hydrate: () => Promise<void>
  signIn: (login: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AUTH_CREDENTIALS = [
  { login: 'courier', password: '123456' },
  { login: 'courier@example.com', password: '123456' },
]

function credentialsMatch(login: string, password: string) {
  const normalizedLogin = login.trim().toLowerCase()
  return AUTH_CREDENTIALS.some(item => (
    item.login.toLowerCase() === normalizedLogin && item.password === password
  ))
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  authorized: false,

  async hydrate() {
    const authorized = await readAuthorizedState()
    set({ authorized, status: 'ready' })
  },

  async signIn(login, password) {
    const valid = credentialsMatch(login, password)
    if (!valid) return false

    await persistAuthorizedState(true)
    set({ authorized: true })
    return true
  },

  async signOut() {
    await clearAuthorizedState()
    set({ authorized: false })
  },
}))
