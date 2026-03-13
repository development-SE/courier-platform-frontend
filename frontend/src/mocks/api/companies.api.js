import { storage } from '../../utils/storage'

const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

const normalize = (value) => String(value || '').toLowerCase()

export const companiesApi = {
  async list({ search = '', page = 1, pageSize = 10 } = {}) {
    await delay()

    let companies = storage.getCompanies()

    if (search) {
      const q = normalize(search)
      companies = companies.filter(c =>
        normalize(c.name).includes(q) ||
        normalize(c.bin).includes(q) ||
        normalize(c.director).includes(q)
      )
    }

    const total = companies.length
    const startIdx = (page - 1) * pageSize
    const items = companies.slice(startIdx, startIdx + pageSize)

    return { items, total }
  },

  async create(dto) {
    await delay()

    if (!dto.name?.trim()) throw new Error('Company name is required')
    if (!dto.bin?.trim()) throw new Error('BIN is required')
    if (!/^\d{12}$/.test(dto.bin)) throw new Error('BIN must be 12 digits')
    if (!dto.director?.trim()) throw new Error('Director is required')

    const companies = storage.getCompanies()
    const newCompany = {
      id: String(Math.max(...companies.map(c => parseInt(c.id) || 0), 0) + 1),
      name: dto.name.trim(),
      bin: dto.bin.trim(),
      director: dto.director.trim(),
    }

    companies.push(newCompany)
    storage.setCompanies(companies)
    return newCompany
  },

  async update(id, dto) {
    await delay()

    const companies = storage.getCompanies()
    const idx = companies.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Company not found')

    if (!dto.name?.trim()) throw new Error('Company name is required')
    if (!dto.bin?.trim()) throw new Error('BIN is required')
    if (!/^\d{12}$/.test(dto.bin)) throw new Error('BIN must be 12 digits')
    if (!dto.director?.trim()) throw new Error('Director is required')

    companies[idx] = {
      ...companies[idx],
      name: dto.name.trim(),
      bin: dto.bin.trim(),
      director: dto.director.trim(),
    }

    storage.setCompanies(companies)
    return companies[idx]
  },

  async remove(id) {
    await delay()
    const companies = storage.getCompanies()
    storage.setCompanies(companies.filter(c => c.id !== id))
  },
}
