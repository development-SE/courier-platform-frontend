import {
  COURIER,
  BALANCE,
  ORDERS,
  INCOMING_ORDER,
  SLOTS,
  MESSAGES,
  COURIER_POSITION,
} from '../mock/courier'
import { createCourierDataUseCases } from '@core/use-cases/courier-data/snapshots'

const courierDataUseCases = createCourierDataUseCases({
  repository: {
    getCourierProfile: () => COURIER,
    getBalanceSnapshot: () => BALANCE,
    getIncomingOrderPreview: () => INCOMING_ORDER,
    getSlotsSnapshot: () => SLOTS,
    getMessagesSnapshot: () => MESSAGES,
    getCourierPosition: () => COURIER_POSITION,
    getOrdersSeed: () => ORDERS,
  },
})

export function getCourierProfile() {
  return courierDataUseCases.getCourierProfile()
}

export function getBalanceSnapshot() {
  return courierDataUseCases.getBalanceSnapshot()
}

export function getIncomingOrderPreview() {
  return courierDataUseCases.getIncomingOrderPreview()
}

export function getSlotsSnapshot() {
  return courierDataUseCases.getSlotsSnapshot()
}

export function getMessagesSnapshot() {
  return courierDataUseCases.getMessagesSnapshot()
}

export function getCourierPosition() {
  return courierDataUseCases.getCourierPosition()
}

export function getOrdersSeed() {
  return courierDataUseCases.getOrdersSeed()
}
