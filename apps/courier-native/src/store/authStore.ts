import { create } from 'zustand'
import { clearAuthorizedState, persistAuthorizedState, readAuthorizedState, readAuthTokens, persistAuthTokens, clearAuthTokens } from '../platform/authStorage'
import { loginWithBackend, registerWithBackend } from '../data/authApi'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function atobPureJS(input: string): string {
  const str = String(input).replace(/=+$/, '')
  let output = ''
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.")
  }
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer)
  }
  return output
}

function decodeJwt(token: string): { sub?: string; role?: string; username?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const raw = atobPureJS(base64)
    return JSON.parse(raw)
  } catch (e) {
    console.log('Error decoding JWT:', e)
    return null
  }
}

type AuthStatus = 'loading' | 'ready'

type AuthState = {
  status: AuthStatus
  authorized: boolean
  accessToken?: string
  refreshToken?: string
  courierId?: string
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
  courierId: undefined,

  async hydrate() {
    const authorized = await readAuthorizedState()
    const tokens = await readAuthTokens()
    let courierId: string | undefined = undefined
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken)
      if (decoded?.sub) {
        courierId = decoded.sub
      }
    }
    set({
      authorized: Boolean(authorized || tokens?.accessToken),
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      courierId,
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

    let courierId: string | undefined = undefined
    const decoded = decodeJwt(accessToken)
    if (decoded?.sub) {
      courierId = decoded.sub
    }

    set({ authorized: true, accessToken, refreshToken, courierId })
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
    set({ authorized: false, accessToken: undefined, refreshToken: undefined, courierId: undefined })
  },
}))
