import { create } from 'zustand'

export type CourierStatus = 'offline' | 'online' | 'busy'
export type ActiveStage = 'arrived' | 'pickedUp' | 'onWay' | 'delivered'

export const STAGE_META: Record<ActiveStage, { chip: string; action: string }> = {
  arrived: { chip: 'На точке', action: 'ПРИБЫЛ' },
  pickedUp: { chip: 'Заказ принят', action: 'ПРИНЯЛ' },
  onWay: { chip: 'В пути', action: 'В ПУТИ' },
  delivered: { chip: 'Передача клиенту', action: 'ДОСТАВЛЕН' },
}

type ShiftState = {
  status: CourierStatus
  activating: boolean
  showIncoming: boolean
  activeOrderId: string | null
  stage: ActiveStage
  hasHydratedStatus: boolean

  hydrateStatus: (status: CourierStatus) => void
  setStatus: (status: CourierStatus) => void
  setActivating: (value: boolean) => void
  setShowIncoming: (value: boolean) => void

  acceptOrder: (orderId: string) => void
  advanceStage: () => boolean
  cancelActiveOrder: () => void
  endShift: () => void
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  status: 'offline',
  activating: false,
  showIncoming: false,
  activeOrderId: null,
  stage: 'arrived',
  hasHydratedStatus: false,

  hydrateStatus(status) {
    const current = get()
    if (current.hasHydratedStatus) return
    set({ status, hasHydratedStatus: true })
  },

  setStatus(status) {
    set({ status })
  },

  setActivating(value) {
    set({ activating: value })
  },

  setShowIncoming(value) {
    set({ showIncoming: value })
  },

  acceptOrder(orderId) {
    set({
      activeOrderId: orderId,
      stage: 'arrived',
      status: 'busy',
      showIncoming: false,
    })
  },

  advanceStage() {
    const { stage } = get()
    if (stage === 'arrived') {
      set({ stage: 'pickedUp' })
      return false
    }
    if (stage === 'pickedUp') {
      set({ stage: 'onWay' })
      return false
    }
    if (stage === 'onWay') {
      set({ stage: 'delivered' })
      return false
    }

    set({
      activeOrderId: null,
      stage: 'arrived',
      status: 'online',
    })
    return true
  },

  cancelActiveOrder() {
    set({
      activeOrderId: null,
      stage: 'arrived',
      status: 'online',
      showIncoming: false,
    })
  },

  endShift() {
    set({
      status: 'offline',
      activating: false,
      showIncoming: false,
      activeOrderId: null,
      stage: 'arrived',
    })
  },
}))
