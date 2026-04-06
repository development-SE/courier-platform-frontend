import { DEFAULT_COURIER_DATA } from '../../fixtures/courierData'

export function createInMemoryCourierDataRepository(seed = DEFAULT_COURIER_DATA) {
  const snapshot = {
    courier: seed.courier ?? DEFAULT_COURIER_DATA.courier,
    balance: seed.balance ?? DEFAULT_COURIER_DATA.balance,
    incomingOrder: seed.incomingOrder ?? DEFAULT_COURIER_DATA.incomingOrder,
    slots: seed.slots ?? DEFAULT_COURIER_DATA.slots,
    messages: seed.messages ?? DEFAULT_COURIER_DATA.messages,
    courierPosition: seed.courierPosition ?? DEFAULT_COURIER_DATA.courierPosition,
    orders: seed.orders ?? DEFAULT_COURIER_DATA.orders,
  }

  return {
    getCourierProfile: () => snapshot.courier,
    getBalanceSnapshot: () => snapshot.balance,
    getIncomingOrderPreview: () => snapshot.incomingOrder,
    getSlotsSnapshot: () => snapshot.slots,
    getMessagesSnapshot: () => snapshot.messages,
    getCourierPosition: () => snapshot.courierPosition,
    getOrdersSeed: () => snapshot.orders,
  }
}
