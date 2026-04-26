import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const usersApi = {
  async listCouriers({ search = '', page = 1, pageSize = 500 } = {}) {
    const token = auth.getToken()
    const authParams = new URLSearchParams()
    authParams.append('role', 'COURIER')
    authParams.append('page', page)
    authParams.append('size', pageSize)

    const userParams = new URLSearchParams()
    if (search) userParams.append('search', search)
    userParams.append('role', 'COURIER')
    userParams.append('page', page)
    userParams.append('size', pageSize)

    const requests = [
      api.get(`/auth/users?${authParams.toString()}`, token)
        .then(data => data.data || [])
        .catch(() => []),
      api.get(`/users?${userParams.toString()}`, token)
        .then(data => data.content || [])
        .catch(() => []),
    ]

    const results = await Promise.all(requests)
    const usersById = new Map()

    results.flat().forEach(user => {
      const id = user.userId || user.id
      if (!id) return
      usersById.set(String(id), {
        ...user,
        id,
        userId: id,
      })
    })

    const items = Array.from(usersById.values())
    return {
      items,
      total: items.length,
    }
  },

  async list({ search = '', role = '', companyId = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (role) params.append('role', role)
    if (companyId) params.append('companyId', companyId)
    params.append('page', page)
    params.append('size', pageSize)

    const data = await api.get(`/employees?${params.toString()}`, token)
    return {
      items: data.content || [],
      total: data.totalItems || 0,
    }
    
  },

  async listAdmins({ search = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    params.append('role', 'ADMIN')
    params.append('page', page)
    params.append('size', pageSize)

    const data = await api.get(`/auth/users?${params.toString()}`, token)
    const items = (data.data || [])
      .filter(user => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return [
          user.email,
          user.firstName,
          user.lastName,
          user.phone,
        ].some(value => String(value || '').toLowerCase().includes(query))
      })
      .map(user => ({
        id: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: '',
        companyName: '---',
        companyBin: '',
        isEmailVerified: user.isEmailVerified,
      }))

    return {
      items,
      total: items.length,
    }
  },

  async create(dto) {
    const token = auth.getToken()
    const { companyId, ...body } = dto
    const url = companyId
      ? `/employees?companyId=${companyId}`
      : '/employees'
    const data = await api.post(url, {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: body.role,   // DIRECTOR | MANAGER
    }, token)
    return data
  },

  async update(id, dto) {
    const token = auth.getToken()
    const data = await api.put(`/employees/${id}`, dto, token)
    return data
  },

  async remove(id, role) {
    const token = auth.getToken()
    // Admin users are stored in auth service
    if (role === 'ADMIN') {
      await api.delete(`/auth/users/${id}`, token)
    } else {
      await api.delete(`/employees/${id}`, token)
    }
  },

  
}
