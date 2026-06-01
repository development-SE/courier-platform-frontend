import { create } from 'zustand'
import { useAuthStore } from './authStore'
import {
  toggleOnlineStatus,
  updateAssignmentStatus,
  verifyDeliveryCode,
} from '../data/logisticsApi'

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
  activeAssignmentId: string | null
  stage: ActiveStage
  hasHydratedStatus: boolean

  hydrateStatus: (status: CourierStatus) => void
  setStatus: (status: CourierStatus) => Promise<void>
  setActivating: (value: boolean) => void
  setShowIncoming: (value: boolean) => void

  acceptOrder: (assignmentId: string, orderId: string) => Promise<boolean>
  rejectOrder: (assignmentId: string) => Promise<boolean>
  advanceStage: () => Promise<boolean>
  verifyOTP: (otpCode: string) => Promise<{ success: boolean; message?: string }>
  cancelActiveOrder: () => Promise<boolean>
  endShift: () => Promise<void>
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  status: 'offline',
  activating: false,
  showIncoming: false,
  activeOrderId: null,
  activeAssignmentId: null,
  stage: 'arrived',
  hasHydratedStatus: false,

  hydrateStatus(status) {
    const current = get()
    if (current.hasHydratedStatus) return
    set({ status, hasHydratedStatus: true })
  },

  async setStatus(status) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      const isOnline = status === 'online' || status === 'busy'
      await toggleOnlineStatus(accessToken, isOnline)
    }
    set({ status })
  },

  setActivating(value) {
    set({ activating: value })
  },

  setShowIncoming(value) {
    set({ showIncoming: value })
  },

  async acceptOrder(assignmentId, orderId) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      const res = await updateAssignmentStatus(accessToken, assignmentId, 'ACCEPTED')
      if (!res.ok || !res.data.success) {
        console.log('Failed to accept order on backend:', res.error)
        return false
      }
    }
    set({
      activeOrderId: orderId,
      activeAssignmentId: assignmentId,
      stage: 'arrived',
      status: 'busy',
      showIncoming: false,
    })
    return true
  },

  async rejectOrder(assignmentId) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      const res = await updateAssignmentStatus(accessToken, assignmentId, 'REJECTED', 'Courier skipped')
      if (!res.ok || !res.data.success) {
        console.log('Failed to reject order on backend:', res.error)
        return false
      }
    }
    set({
      showIncoming: false,
    })
    return true
  },

  async advanceStage() {
    const { stage, activeAssignmentId } = get()
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken || !activeAssignmentId) return false

    if (stage === 'arrived') {
      const res = await updateAssignmentStatus(accessToken, activeAssignmentId, 'PICKED_UP')
      if (res.ok && res.data.success) {
        set({ stage: 'pickedUp' })
      } else {
        console.log('Failed to transition to PICKED_UP:', res.error)
      }
      return false
    }

    if (stage === 'pickedUp') {
      const res = await updateAssignmentStatus(accessToken, activeAssignmentId, 'IN_TRANSIT')
      if (res.ok && res.data.success) {
        set({ stage: 'onWay' })
      } else {
        console.log('Failed to transition to IN_TRANSIT:', res.error)
      }
      return false
    }

    if (stage === 'onWay') {
      const res = await updateAssignmentStatus(accessToken, activeAssignmentId, 'ARRIVED')
      if (res.ok && res.data.success) {
        set({ stage: 'delivered' })
      } else {
        console.log('Failed to transition to ARRIVED:', res.error)
      }
      return false
    }

    return false
  },

  async verifyOTP(otpCode) {
    const { activeAssignmentId } = get()
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken || !activeAssignmentId) {
      return { success: false, message: 'No active assignment or credentials' }
    }

    const res = await verifyDeliveryCode(accessToken, activeAssignmentId, otpCode)
    if (res.ok && res.data.success) {
      set({
        activeOrderId: null,
        activeAssignmentId: null,
        stage: 'arrived',
        status: 'online',
      })
      return { success: true }
    } else {
      const errorMsg = res.error?.message || 'Invalid code'
      return { success: false, message: errorMsg }
    }
  },

  async cancelActiveOrder() {
    const { activeAssignmentId } = get()
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken && activeAssignmentId) {
      await updateAssignmentStatus(accessToken, activeAssignmentId, 'CANCELLED', 'Courier cancelled')
    }
    set({
      activeOrderId: null,
      activeAssignmentId: null,
      stage: 'arrived',
      status: 'online',
      showIncoming: false,
    })
    return true
  },

  async endShift() {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      await toggleOnlineStatus(accessToken, false)
    }
    set({
      status: 'offline',
      activating: false,
      showIncoming: false,
      activeOrderId: null,
      activeAssignmentId: null,
      stage: 'arrived',
    })
  },
}))
