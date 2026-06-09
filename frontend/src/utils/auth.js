import { api, BASE_URL } from './api'

const SESSION_KEY = 'auth_session'

export const auth = {
  initialize() {
    const session = this.getSession()
    if (!session?.accessToken) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  },

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

  /** Decode JWT payload without verifying signature (client-side only). */
  decodeToken(token) {
    try {
      const payload = token.split('.')[1]
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
      return null
    }
  },

  getDefaultRoute(session = null) {
    const activeSession = session || this.getSession()
    if (!activeSession) return '/sign-in'

    const role = activeSession.role?.toUpperCase()
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/orders'
      case 'DIRECTOR':
      case 'PARTNER':
        return '/'
      case 'MANAGER':
        return '/my-company'
      case 'USER':
      case 'CLIENT':
      case 'COURIER':
        return '/user-home'
      default:
        return '/my-company'
    }
  },

  async signIn(email, password) {
    const data = await api.post('/auth/login', { email, password })
    const decoded = this.decodeToken(data.data.accessToken)
    
    // Fetch actual user profile name
    let profile = null
    try {
      profile = await api.get('/users/me', data.data.accessToken)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }

    const session = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      role: data.data.role,
      userId: decoded?.sub || null,
      companyId: decoded?.companyId || null,
      email: decoded?.username || null,
      name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : null
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async signUp({ firstName, lastName, email, password, phone, role = 'ADMIN' }) {
    const data = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      pushConsent: false,
      role,
    })

    const confirmationToken = data?.data?.confirmationToken || null
    return {
      ...data,
      verifyUrl: confirmationToken ? `${BASE_URL}/auth/verify?token=${confirmationToken}` : null,
    }
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY)
  },
}
