import { apiClient } from './client'

export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    return res.data
  },

  register: async (data) => {
    const res = await apiClient.post('/auth/register', data)
    return res.data
  },

  verifyEmail: async (token) => {
    const res = await apiClient.get(`/auth/verify?token=${token}`)
    return res.data
  },
}