import { api } from './api'

const SESSION_KEY = 'auth_session'

export const auth = {
  isAuthenticated() {
    return Boolean(this.getSession())
  },

  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  getToken() {
    return this.getSession()?.accessToken || null
  },

  getDefaultRoute(session = null) {
    const activeSession = session || this.getSession()
    if (!activeSession) return '/sign-in'

    switch (activeSession.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/orders'
      case 'DIRECTOR':
      case 'MANAGER':
      case 'PARTNER':
        return '/my-company'
      case 'USER':
      case 'CLIENT':
        return '/user-home'
      default:
        return '/my-company'
    }
  },

  async signIn(email, password) {
    const data = await api.post('/auth/login', { email, password })
    const session = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      role: data.data.role,
      userId: data.data.userId,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async signUp({ firstName, lastName, email, password, phone }) {
    await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      pushConsent: false,
      role: 'CLIENT',
    })
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY)
  },
}
