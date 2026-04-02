import {
  COURIER,
  BALANCE,
  ORDERS,
  INCOMING_ORDER,
  SLOTS,
  MESSAGES,
  COURIER_POSITION,
} from '../mock/courier'
import { normalizeOrders } from '../domain/orders/model'
import { normalizeMessages } from '../domain/messages/model'
import { normalizeCourierProfile } from '../domain/profile/model'
import { normalizeBalance } from '../domain/balance/model'
import { normalizeSlots } from '../domain/slots/model'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function getCourierProfile() {
  return normalizeCourierProfile(clone(COURIER))
}

export function getBalanceSnapshot() {
  return normalizeBalance(clone(BALANCE))
}

export function getIncomingOrderPreview() {
  return INCOMING_ORDER
}

export function getSlotsSnapshot() {
  return normalizeSlots(clone(SLOTS))
}

export function getMessagesSnapshot() {
  return normalizeMessages(clone(MESSAGES))
}

export function getCourierPosition() {
  return [...COURIER_POSITION]
}

export function getOrdersSeed() {
  return normalizeOrders(clone(ORDERS))
}
