import { createCourierDataRepository } from '../../contracts/courierDataRepository'
import { normalizeBalance } from '../../domain/balance/model'
import { normalizeMessages } from '../../domain/messages/model'
import { normalizeOrders } from '../../domain/orders/model'
import { normalizeCourierProfile } from '../../domain/profile/model'
import { normalizeSlots } from '../../domain/slots/model'

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createCourierDataUseCases({ repository } = {}) {
  const dataRepository = createCourierDataRepository(repository)

  return {
    getCourierProfile() {
      return normalizeCourierProfile(deepClone(dataRepository.getCourierProfile()))
    },

    getBalanceSnapshot() {
      return normalizeBalance(deepClone(dataRepository.getBalanceSnapshot()))
    },

    getIncomingOrderPreview() {
      return deepClone(dataRepository.getIncomingOrderPreview())
    },

    getSlotsSnapshot() {
      return normalizeSlots(deepClone(dataRepository.getSlotsSnapshot()))
    },

    getMessagesSnapshot() {
      return normalizeMessages(deepClone(dataRepository.getMessagesSnapshot()))
    },

    getCourierPosition() {
      const position = dataRepository.getCourierPosition()
      return Array.isArray(position) ? [...position] : []
    },

    getOrdersSeed() {
      return normalizeOrders(deepClone(dataRepository.getOrdersSeed()))
    },
  }
}
