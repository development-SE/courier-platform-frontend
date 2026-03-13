import { storage } from './storage'

export const validators = {
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!regex.test(email)) return 'Invalid email format'
    return null
  },

  validatePhone(phone) {
    const regex = /^\+?[\d\s\-()]+$/
    if (!phone) return 'Phone is required'
    if (!regex.test(phone)) return 'Invalid phone format'
    return null
  },

  validateFirstName(firstName) {
    if (!firstName || firstName.trim() === '') return 'First name is required'
    return null
  },

  validateLastName(lastName) {
    if (!lastName || lastName.trim() === '') return 'Last name is required'
    return null
  },

  validateRole(role) {
    if (!role) return 'Role is required'
    return null
  },

  isEmailUnique(email, excludeId = null) {
    const users = storage.getUsers()
    return !users.some(u => u.email === email && u.id !== excludeId)
  },

  isPhoneUnique(phone, excludeId = null) {
    const users = storage.getUsers()
    return !users.some(u => u.phone === phone && u.id !== excludeId)
  },

  validateEmailUnique(email, excludeId = null) {
    if (!this.isEmailUnique(email, excludeId)) {
      return 'Email already exists'
    }
    return null
  },

  validatePhoneUnique(phone, excludeId = null) {
    if (!this.isPhoneUnique(phone, excludeId)) {
      return 'Phone already exists'
    }
    return null
  },
}