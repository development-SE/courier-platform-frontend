import { api } from '../utils/api'
import { auth } from '../utils/auth'

export const addressesApi = {
  async list({ search = '', type = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    
    // Helper to fetch company-scoped addresses
    const fetchCompanies = async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('page', 1)
      params.append('size', 1000) // fetch all for local sorting/merging
      try {
        const data = await api.get(`/addresses?${params.toString()}`, token)
        return (data.content || []).map(item => ({ ...item, type: 'company' }))
      } catch {
        return []
      }
    }

    // Helper to fetch user-scoped addresses from user-service
    const fetchUsers = async () => {
      const params = new URLSearchParams()
      params.append('page', 1)
      params.append('size', 1000) // fetch all for local sorting/merging
      try {
        const data = await api.get(`/users/me/addresses?${params.toString()}`, token)
        return (data.content || []).map(item => ({ 
          ...item, 
          type: 'user',
          ownerId: item.userId // map to match the frontend expected 'ownerId' key
        }))
      } catch {
        return []
      }
    }

    const session = auth.getSession()
    const role = session?.role?.toUpperCase()
    const isCompanyScoped = role === 'DIRECTOR' || role === 'PARTNER' || role === 'MANAGER'
    const resolvedType = isCompanyScoped ? 'company' : type

    let mergedItems = []

    if (resolvedType === 'company') {
      mergedItems = await fetchCompanies()
    } else if (resolvedType === 'user') {
      mergedItems = await fetchUsers()
    } else {
      // Fetch both for 'All'
      const [companies, users] = await Promise.all([fetchCompanies(), fetchUsers()])
      mergedItems = [...companies, ...users]
    }

    // Search filter (local)
    if (search) {
      const query = search.toLowerCase()
      mergedItems = mergedItems.filter(item => 
        (item.street && item.street.toLowerCase().includes(query)) ||
        (item.house && item.house.toLowerCase().includes(query)) ||
        (item.city && item.city.toLowerCase().includes(query))
      )
    }

    // Sort by createdAt descending
    mergedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Perform manual pagination
    const total = mergedItems.length
    const startIndex = (page - 1) * pageSize
    const paginatedItems = mergedItems.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedItems,
      total: total,
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