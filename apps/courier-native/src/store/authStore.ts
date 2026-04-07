import { create } from 'zustand'
import { clearAuthorizedState, persistAuthorizedState, readAuthorizedState, readAuthTokens, persistAuthTokens, clearAuthTokens } from '../platform/authStorage'
import { loginWithBackend, registerWithBackend } from '../data/authApi'

type AuthStatus = 'loading' | 'ready'

type AuthState = {
  status: AuthStatus
  authorized: boolean
  accessToken?: string
  refreshToken?: string
  hydrate: () => Promise<void>
  signIn: (login: string, password: string) => Promise<boolean>
  signUp: (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  authorized: false,
  accessToken: undefined,
  refreshToken: undefined,

  async hydrate() {
    const authorized = await readAuthorizedState()
    const tokens = await readAuthTokens()
    set({
      authorized: Boolean(authorized || tokens?.accessToken),
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      status: 'ready',
    })
  },

  async signIn(login, password) {
    const response = await loginWithBackend({
      email: login.trim(),
      password,
    })

    if (!response.ok || !response.data?.success || !response.data.data?.accessToken) {
      return false
    }

    const { accessToken, refreshToken } = response.data.data
    await persistAuthorizedState(true)
    await persistAuthTokens({ accessToken, refreshToken })
    set({ authorized: true, accessToken, refreshToken })
    return true
  },

  async signUp({ email, password, firstName, lastName, phone }) {
    const response = await registerWithBackend({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim(), phone })
    if (!response.ok) {
      return { ok: false, message: response.error.message }
    }
    if (!response.data?.success) {
      const msg = response.data?.error?.message ?? response.data?.message
      return { ok: false, message: typeof msg === 'string' ? msg : 'Registration failed. Please try again.' }
    }
    return { ok: true }
  },

  async signOut() {
    await clearAuthorizedState()
    await clearAuthTokens()
    set({ authorized: false, accessToken: undefined, refreshToken: undefined })
  },
}))
