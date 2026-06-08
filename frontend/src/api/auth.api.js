import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const authApi = {
  async register({ firstName, lastName, email, password, phone, role = 'ADMIN' }) {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      pushConsent: false,
      role,
    }, null)
    return unwrap(response)
  },

  async login({ email, password }) {
    const response = await api.post('/auth/login', { email, password }, null)
    return unwrap(response)
  },

  async refresh({ refreshToken }) {
    const response = await api.post('/auth/refresh', { refreshToken }, null)
    return unwrap(response)
  },

  async logout({ refreshToken }) {
    const response = await api.post('/auth/logout', { refreshToken }, null)
    return unwrap(response)
  },

  async createStaff({ firstName, lastName, email, password, phone, role }) {
    const response = await api.post('/auth/staff', {
      firstName,
      lastName,
      email,
      password,
      phone: phone || undefined,
      role,
    }, token())
    return unwrap(response)
  },
}
