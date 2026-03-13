import { storage } from '../../utils/storage'

const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

const normalize = (value) => String(value || '').toLowerCase()

export const addressesApi = {
  async list({
    search = '',
    type = '',
    ownerId = '',
    page = 1,
    pageSize = 10,
  } = {}) {
    await delay()

    let addresses = storage.getAddresses()
    const users = storage.getUsers()
    const companies = storage.getCompanies()
    const companyNameById = new Map(companies.map(c => [c.id, c.name || '']))
    const userNameById = new Map(
      users.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim()]),
    )

    if (type) {
      addresses = addresses.filter(a => a.type === type)
    }

    if (ownerId) {
      addresses = addresses.filter(a => a.ownerId === ownerId)
    }

    if (search) {
      const q = normalize(search)
      addresses = addresses.filter(a =>
        normalize(a.street).includes(q) ||
        normalize(a.house).includes(q) ||
        normalize(a.apartment).includes(q) ||
        normalize(a.entrance).includes(q) ||
        (a.type === 'company' && normalize(companyNameById.get(a.ownerId)).includes(q)) ||
        (a.type === 'user' && normalize(userNameById.get(a.ownerId)).includes(q))
      )
    }

    const total = addresses.length
    const startIdx = (page - 1) * pageSize
    const items = addresses.slice(startIdx, startIdx + pageSize)

    return { items, total }
  },

  async create(dto) {
    await delay()

    if (!dto.type) throw new Error('Type is required')
    if (!dto.ownerId) throw new Error('Owner is required')
    if (!dto.street?.trim()) throw new Error('Street is required')
    if (!dto.house?.trim()) throw new Error('House is required')

    const addresses = storage.getAddresses()
    const newAddress = {
      id: String(Math.max(...addresses.map(a => parseInt(a.id) || 0), 0) + 1),
      type: dto.type,
      ownerId: dto.ownerId,
      street: dto.street.trim(),
      house: dto.house.trim(),
      apartment: dto.apartment?.trim() || '',
      entrance: dto.entrance?.trim() || '',
    }

    addresses.push(newAddress)
    storage.setAddresses(addresses)
    return newAddress
  },

  async update(id, dto) {
    await delay()

    const addresses = storage.getAddresses()
    const idx = addresses.findIndex(a => a.id === id)
    if (idx === -1) throw new Error('Address not found')

    if (!dto.type) throw new Error('Type is required')
    if (!dto.ownerId) throw new Error('Owner is required')
    if (!dto.street?.trim()) throw new Error('Street is required')
    if (!dto.house?.trim()) throw new Error('House is required')

    addresses[idx] = {
      ...addresses[idx],
      type: dto.type,
      ownerId: dto.ownerId,
      street: dto.street.trim(),
      house: dto.house.trim(),
      apartment: dto.apartment?.trim() || '',
      entrance: dto.entrance?.trim() || '',
    }

    storage.setAddresses(addresses)
    return addresses[idx]
  },

  async remove(id) {
    await delay()
    const addresses = storage.getAddresses()
    storage.setAddresses(addresses.filter(a => a.id !== id))
  },
}
