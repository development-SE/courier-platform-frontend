import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const companiesApi = {
  async list({ search = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('size', pageSize)

    const data = await api.get(`/companies?${params.toString()}`, token)
    return {
      items: data.content || [],
      total: data.totalItems || 0,
    }
  },

  async create(dto) {
    const token = auth.getToken()
    const data = await api.post('/companies', {
      name: dto.name,
      bin: dto.bin,
    }, token)
    return data
  },

  async update(id, dto) {
    const token = auth.getToken()
    const data = await api.put(`/companies/${id}`, {
      name: dto.name,
      bin: dto.bin,
    }, token)
    return data
  },

  async remove(id) {
    const token = auth.getToken()
    await api.delete(`/companies/${id}`, token)
  },
}