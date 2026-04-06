import {
  buildMessagesView,
  createCourierDataUseCases,
  createInMemoryCourierDataRepository,
  DEFAULT_COURIER_DATA,
  type CourierProfile,
  type BalanceSnapshot,
  type IncomingOrderPreview,
  type CourierMessage,
  type CourierOrder,
  type CourierSlot,
} from '@swiftdeliver/core'

const courierDataUseCases = createCourierDataUseCases({
  repository: createInMemoryCourierDataRepository(DEFAULT_COURIER_DATA),
})

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchOrdersFromCore(): Promise<CourierOrder[]> {
  await wait(220)
  return courierDataUseCases.getOrdersSeed()
}

export async function fetchCourierProfileFromCore(): Promise<CourierProfile> {
  await wait(160)
  return courierDataUseCases.getCourierProfile()
}

export async function fetchBalanceFromCore(): Promise<BalanceSnapshot> {
  await wait(180)
  return courierDataUseCases.getBalanceSnapshot()
}

export async function fetchSlotsFromCore(): Promise<CourierSlot[]> {
  await wait(160)
  return courierDataUseCases.getSlotsSnapshot()
}

export async function fetchMessagesViewFromCore(): Promise<{
  messages: CourierMessage[]
  unreadCount: number
  groupedMessages: Record<string, CourierMessage[]>
}> {
  await wait(180)
  const messages = courierDataUseCases.getMessagesSnapshot()
  return buildMessagesView(messages)
}

export async function fetchDashboardSnapshotFromCore(): Promise<{
  courier: CourierProfile
  incomingOrder: IncomingOrderPreview
  courierPosition: [number, number]
  orders: CourierOrder[]
}> {
  await wait(200)
  return {
    courier: courierDataUseCases.getCourierProfile(),
    incomingOrder: courierDataUseCases.getIncomingOrderPreview(),
    courierPosition: courierDataUseCases.getCourierPosition(),
    orders: courierDataUseCases.getOrdersSeed(),
  }
}
