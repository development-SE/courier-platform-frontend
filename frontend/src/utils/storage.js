import { usersSeed } from '../mocks/data/users.seed'
import { companiesSeed } from '../mocks/data/companies.seed'
import { addressesSeed } from '../mocks/data/addresses.seed'
import { ordersSeed } from '../mocks/data/orders.seed'

const USERS_KEY = 'users'
const COMPANIES_KEY = 'companies'
const ADDRESSES_KEY = 'addresses'
const ORDERS_KEY = 'orders'

export const storage = {
  initializeSeed() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(usersSeed))
    } else {
      // Repair corrupted users data if it looks identical or missing names
      try {
        const currentUsers = JSON.parse(localStorage.getItem(USERS_KEY)) || []
        const seedById = new Map(usersSeed.map(u => [u.id, u]))
        const uniqueNames = new Set(
          currentUsers.map(u => `${u.firstName || ''} ${u.lastName || ''}`.trim()),
        )
        const looksCorrupted = currentUsers.length > 1 && uniqueNames.size === 1

        if (looksCorrupted) {
          localStorage.setItem(USERS_KEY, JSON.stringify(usersSeed))
        } else {
          const repaired = currentUsers.map(u => {
            const seed = seedById.get(u.id)
            if (!seed) {
              return {
                ...u,
                role: u.role === 'Dispatcher' ? 'Courier' : u.role,
              }
            }
            return {
              ...seed,
              ...u,
              firstName: u.firstName || seed.firstName,
              lastName: u.lastName || seed.lastName,
              role: u.role === 'Dispatcher' ? 'Courier' : (u.role || seed.role),
            }
          })
          localStorage.setItem(USERS_KEY, JSON.stringify(repaired))
        }
      } catch {
        localStorage.setItem(USERS_KEY, JSON.stringify(usersSeed))
      }
    }
    if (!localStorage.getItem(COMPANIES_KEY)) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesSeed))
    } else {
      // Migrate existing companies to include new fields from seed (e.g., director)
      try {
        const current = JSON.parse(localStorage.getItem(COMPANIES_KEY)) || []
        const seedById = new Map(companiesSeed.map(c => [c.id, c]))
        const seedByName = new Map(companiesSeed.map(c => [c.name, c]))

        const migrated = current.map(c => {
          const seed = seedById.get(c.id) || seedByName.get(c.name)
          if (!seed) return c
          return {
            ...seed,
            ...c,
            director: c.director || seed.director || '',
          }
        })

        localStorage.setItem(COMPANIES_KEY, JSON.stringify(migrated))
      } catch {
        // If parsing fails, reset to seed
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesSeed))
      }
    }
    if (!localStorage.getItem(ADDRESSES_KEY)) {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addressesSeed))
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersSeed))
    }
  },

  getUsers() {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  },

  setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    window.dispatchEvent(new Event('users-updated'))
  },

  getCompanies() {
    const data = localStorage.getItem(COMPANIES_KEY)
    return data ? JSON.parse(data) : []
  },

  setCompanies(companies) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies))
  },

  getAddresses() {
    const data = localStorage.getItem(ADDRESSES_KEY)
    return data ? JSON.parse(data) : []
  },

  setAddresses(addresses) {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses))
  },

  getOrders() {
    const data = localStorage.getItem(ORDERS_KEY)
    return data ? JSON.parse(data) : []
  },

  setOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  },

  getUserById(id) {
    const users = this.getUsers()
    return users.find(u => u.id === id)
  },

  getCompanyById(id) {
    const companies = this.getCompanies()
    return companies.find(c => c.id === id)
  },
}
