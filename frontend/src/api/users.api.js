import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const usersApi = {
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

  async remove(id) {
    const token = auth.getToken()
    await api.delete(`/employees/${id}`, token)
  },

  
}
