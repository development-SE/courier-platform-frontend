declare module '@swiftdeliver/core' {
  export type CourierOrderStatus = 'new' | 'pickup' | 'delivery' | 'done' | 'cancelled'

  export type CourierOrder = {
    id: string
    status: CourierOrderStatus
    client: string
    pickupAddress: string
    deliveryAddress: string
    earnings: number
    [key: string]: unknown
  }

  export type CourierProfile = {
    id: string
    name: string
    lastName: string
    rating: number
    reviewCount: number
    score: number
    status: 'offline' | 'online' | 'busy'
    park: string
    phone: string
    [key: string]: unknown
  }

  export type IncomingOrderPreview = {
    id: string
    client: string
    pointsCount: number
    deliveryType: string
    pickupAddress: string
    deliveryAddress: string
    estimatedMin: number
    earnings: number
    distance: string
    priorityGain: number
    priorityLoss: number
    pickupCode?: string | null
    pickupDeadline?: string | null
    deliveryDeadline?: string | null
    parcelsCount?: number
    payment?: string
    comment?: string
    [key: string]: unknown
  }

  export type CourierMessage = {
    id: string
    source: string
    sourceType?: string
    title: string
    text: string
    date: string
    time: string
    unread: boolean
    priority?: string
    [key: string]: unknown
  }

  export type BalanceWeekDay = {
    date: string
    label: string
    earnings: number
    isToday?: boolean
  }

  export type BalanceHistoryItem = {
    id: string
    date: string
    type: 'order' | 'payout'
    amount: number
    label: string
  }

  export type BalanceSnapshot = {
    today: number
    week: number
    month: number
    balance: number
    currency: string
    park: string
    commission: number
    nextPayout: string
    weekDays: BalanceWeekDay[]
    history: BalanceHistoryItem[]
  }

  export type CourierSlot = {
    id: string
    time: string
    date: string
    dayShort: string
    booked: boolean
    available: boolean
    [key: string]: unknown
  }

  export type CourierDataRepository = {
    getCourierProfile: () => CourierProfile
    getBalanceSnapshot: () => BalanceSnapshot
    getIncomingOrderPreview: () => IncomingOrderPreview
    getSlotsSnapshot: () => CourierSlot[]
    getMessagesSnapshot: () => CourierMessage[]
    getCourierPosition: () => [number, number]
    getOrdersSeed: () => CourierOrder[]
  }

  export function createInMemoryCourierDataRepository(seed?: unknown): CourierDataRepository

  export function createCourierDataUseCases(options: { repository: CourierDataRepository }): {
    getCourierProfile: () => CourierProfile
    getBalanceSnapshot: () => BalanceSnapshot
    getIncomingOrderPreview: () => IncomingOrderPreview
    getSlotsSnapshot: () => CourierSlot[]
    getMessagesSnapshot: () => CourierMessage[]
    getCourierPosition: () => [number, number]
    getOrdersSeed: () => CourierOrder[]
  }

  export function buildMessagesView(rawMessages: CourierMessage[]): {
    messages: CourierMessage[]
    unreadCount: number
    groupedMessages: Record<string, CourierMessage[]>
  }

  export const DEFAULT_COURIER_DATA: {
    courier: CourierProfile
    balance: BalanceSnapshot
    orders: CourierOrder[]
    incomingOrder: IncomingOrderPreview
    slots: CourierSlot[]
    messages: CourierMessage[]
    courierPosition: [number, number]
  }

  export const SLOT_STATE: {
    BOOKED: 'booked'
    AVAILABLE: 'available'
    CLOSED: 'closed'
  }

  export function getSlotState(slot: CourierSlot): 'booked' | 'available' | 'closed'
  export function groupSlotsByDate(slots: CourierSlot[]): Record<string, { label: string; slots: CourierSlot[] }>
  export function countBookedSlots(slots: CourierSlot[]): number

  export function getBalanceAmountByPeriod(balance: BalanceSnapshot, period: 'today' | 'week' | 'month'): number
  export function getMaxWeekDayEarnings(weekDays: BalanceWeekDay[]): number

  export function getCourierInitials(courier: CourierProfile): string
}
