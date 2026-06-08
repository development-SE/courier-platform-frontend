import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const employeesApi = {
  async list({ companyId = '', role = '', page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams()
    if (companyId) params.append('companyId', companyId)
    if (role) params.append('role', role)
    params.append('page', page)
    params.append('size', pageSize)

    const response = await api.get(`/employees?${params.toString()}`, token())
    const data = unwrap(response)
    return {
      items: data.content || [],
      total: data.totalElements || data.totalItems || 0,
    }
  },

  async getById(id) {
    const response = await api.get(`/employees/${id}`, token())
    return unwrap(response)
  },

  async create(body) {
    const { companyId, ...dto } = body
    const url = companyId ? `/employees?companyId=${companyId}` : '/employees'
    const response = await api.post(url, dto, token())
    return unwrap(response)
  },

  async update(id, body) {
    const response = await api.put(`/employees/${id}`, body, token())
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/employees/${id}`, token())
    return unwrap(response)
  },
}
