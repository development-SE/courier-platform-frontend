import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const addressesApi = {
  async list({ search = '', type = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (type) params.append('type', type)
    params.append('page', page)
    params.append('pageSize', pageSize)

    const data = await api.get(`/addresses?${params.toString()}`, token)
    return {
      items: data.content || [],
      total: data.totalItems || 0,
    }
  },

  async create(dto) {
    const token = auth.getToken()
    const data = await api.post('/addresses', {
      companyId: dto.ownerId,
      street: dto.street,
      house: dto.house,
      apartment: dto.apartment || null,
      entrance: dto.entrance || null,
      city: dto.city || 'Almaty',
      country: dto.country || 'Kazakhstan',
    }, token)
    return data
  },

  async update(id, dto) {
    const token = auth.getToken()
    const data = await api.put(`/addresses/${id}`, {
      companyId: dto.ownerId,
      street: dto.street,
      house: dto.house,
      apartment: dto.apartment || null,
      entrance: dto.entrance || null,
      city: dto.city || 'Almaty',
      country: dto.country || 'Kazakhstan',
    }, token)
    return data
  },

  async remove(id) {
    const token = auth.getToken()
    await api.delete(`/addresses/${id}`, token)
  },
}