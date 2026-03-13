import { storage } from '../../utils/storage'
import { validators } from '../../utils/validators'

const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 300))

export const usersApi = {
  async list({ search = '', role = '', companyId = '', page = 1, pageSize = 10 }) {
    await delay()

    let users = storage.getUsers()

    if (search) {
      const q = search.toLowerCase()
      users = users.filter(
        u =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      )
    }

    if (role) {
      users = users.filter(u => u.role === role)
    }

    if (companyId) {
      users = users.filter(u => u.companyId === companyId)
    }

    const total = users.length
    const startIdx = (page - 1) * pageSize
    const items = users.slice(startIdx, startIdx + pageSize)

    return { items, total }
  },

  async getById(id) {
    await delay()
    const user = storage.getUserById(id)
    if (!user) throw new Error('User not found')
    return user
  },

  async create(dto) {
    await delay()

    if (!dto.firstName?.trim()) throw new Error('First name is required')
    if (!dto.lastName?.trim()) throw new Error('Last name is required')
    
    const emailError = validators.validateEmail(dto.email)
    if (emailError) throw new Error(emailError)
    
    if (!validators.isEmailUnique(dto.email)) throw new Error('Email already exists')
    
    const phoneError = validators.validatePhone(dto.phone)
    if (phoneError) throw new Error(phoneError)
    
    if (!validators.isPhoneUnique(dto.phone)) throw new Error('Phone already exists')
    if (!dto.role) throw new Error('Role is required')

    const users = storage.getUsers()
    const newUser = {
      id: String(Math.max(...users.map(u => parseInt(u.id) || 0), 0) + 1),
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      companyId: dto.companyId || null,
      role: dto.role,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    storage.setUsers(users)
    return newUser
  },

  async update(id, dto) {
    await delay()

    const users = storage.getUsers()
    const userIdx = users.findIndex(u => u.id === id)
    if (userIdx === -1) throw new Error('User not found')

    if (!dto.firstName?.trim()) throw new Error('First name is required')
    if (!dto.lastName?.trim()) throw new Error('Last name is required')
    
    const emailError = validators.validateEmail(dto.email)
    if (emailError) throw new Error(emailError)
    
    if (!validators.isEmailUnique(dto.email, id)) throw new Error('Email already exists')
    
    const phoneError = validators.validatePhone(dto.phone)
    if (phoneError) throw new Error(phoneError)
    
    if (!validators.isPhoneUnique(dto.phone, id)) throw new Error('Phone already exists')
    if (!dto.role) throw new Error('Role is required')

    users[userIdx] = {
      ...users[userIdx],
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      companyId: dto.companyId || null,
      role: dto.role,
    }

    storage.setUsers(users)
    return users[userIdx]
  },

  async remove(id) {
    await delay()
    const users = storage.getUsers()
    const filtered = users.filter(u => u.id !== id)
    storage.setUsers(filtered)
  },
}