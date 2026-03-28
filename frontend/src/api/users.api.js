import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const usersApi = {
  async list({ search = '', role = '', companyId = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (companyId) params.append('companyId', companyId)
    params.append('page', page)
    params.append('pageSize', pageSize)

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
    password: body.password,  // temporary default password
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
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