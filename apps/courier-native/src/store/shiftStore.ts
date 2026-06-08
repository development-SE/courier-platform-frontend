import { create } from 'zustand'
import { useAuthStore } from './authStore'
import {
  toggleOnlineStatus,
  updateGPSLocation,
  updateAssignmentStatus as apiUpdateAssignmentStatus,
  verifyDeliveryCode,
  resendDeliveryCode,
  listMyAssignments,
  getOrderDetails,
  acceptAssignment,
  rejectAssignment,
  getAssignment,
  type AssignmentResponse,
  type OrderResponse,
  type AssignmentStatus,
} from '../data/logisticsApi'
import { requestLocationPermissions, getCurrentLocation } from '../platform/location'

export type CourierStatus = 'offline' | 'online' | 'busy'
export type ActiveStage = 'arrived' | 'pickedUp' | 'onWay' | 'delivered'

function getRequestErrorMessage(result: { ok: false; error: { message: string } } | { ok: true }) {
  return result.ok ? undefined : result.error.message
}

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

  // Availability / Location fields
  isOnline: boolean
  lastKnownLocation: { latitude: number; longitude: number } | null
  lastLocationSyncAt: number | null
  locationPermissionStatus: 'granted' | 'denied' | 'undetermined' | null
  locationSyncError: string | null
  onlineTogglePending: boolean
  locationSyncPending: boolean

  // Inbox / Assignment fields
  pendingAssignments: AssignmentResponse[]
  activeAssignments: AssignmentResponse[]
  completedAssignments: AssignmentResponse[]
  selectedAssignmentId: string | null
  loading: boolean
  refreshing: boolean
  error: string | null
  lastFetchedAt: number | null
  ordersCache: Record<string, OrderResponse>

  // Mutation states
  actionPendingAssignmentId: string | null
  actionError: string | null

  // Stage 5 Mutation states
  statusMutationAssignmentId: string | null
  statusMutationError: string | null
  lastStatusUpdateAt: number | null

  // Stage 6 Mutation states
  verifyingDeliveryCodeAssignmentId: string | null
  deliveryCodeError: string | null
  deliveryCodeVerifiedAt: number | null

  hydrateStatus: (status: CourierStatus) => void
  setStatus: (status: CourierStatus) => Promise<void>
  setActivating: (value: boolean) => void
  setShowIncoming: (value: boolean) => void

  acceptOrder: (assignmentId: string, orderId: string) => Promise<boolean>
  rejectOrder: (assignmentId: string) => Promise<boolean>
  advanceStage: () => Promise<boolean>
  verifyOTP: (otpCode: string, assignmentId?: string) => Promise<{ success: boolean; message?: string }>
  cancelActiveOrder: () => Promise<boolean>
  endShift: () => Promise<void>

  // New Actions
  setLocationPermissionStatus: (status: 'granted' | 'denied' | 'undetermined' | null) => void
  syncLocationAndStatus: (isOnline: boolean) => Promise<boolean>

  // Stage 3 Actions
  loadAssignments: () => Promise<void>
  refreshAssignments: () => Promise<void>
  loadPendingOffers: () => Promise<void>
  fetchOrderDetails: (orderId: string) => Promise<void>
  clearAssignmentsOnSignOut: () => void

  // Stage 4 Actions
  acceptAssignment: (assignmentId: string) => Promise<boolean>
  rejectAssignment: (assignmentId: string, reason?: string) => Promise<boolean>
  refreshAssignmentAfterAction: (assignmentId: string) => Promise<void>

  // Stage 5 Actions
  updateAssignmentStatus: (assignmentId: string, nextStatus: AssignmentStatus, reason?: string) => Promise<boolean>

  // Stage 6 Actions
  verifyDeliveryCode: (assignmentId: string, confirmationCode: string) => Promise<boolean>
  resendDeliveryCode: (assignmentId: string) => Promise<boolean>
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  status: 'offline',
  activating: false,
  showIncoming: false,
  activeOrderId: null,
  activeAssignmentId: null,
  stage: 'arrived',
  hasHydratedStatus: false,

  isOnline: false,
  lastKnownLocation: null,
  lastLocationSyncAt: null,
  locationPermissionStatus: null,
  locationSyncError: null,
  onlineTogglePending: false,
  locationSyncPending: false,

  pendingAssignments: [],
  activeAssignments: [],
  completedAssignments: [],
  selectedAssignmentId: null,
  loading: false,
  refreshing: false,
  error: null,
  lastFetchedAt: null,
  ordersCache: {},

  actionPendingAssignmentId: null,
  actionError: null,

  // Stage 5 Mutation states
  statusMutationAssignmentId: null,
  statusMutationError: null,
  lastStatusUpdateAt: null,

  // Stage 6 Mutation states
  verifyingDeliveryCodeAssignmentId: null,
  deliveryCodeError: null,
  deliveryCodeVerifiedAt: null,

  hydrateStatus(status) {
    const current = get()
    if (current.hasHydratedStatus) return
    const isOnline = status === 'online' || status === 'busy'
    set({ status, isOnline, hasHydratedStatus: true })
  },

  async setStatus(status) {
    const isOnline = status === 'online' || status === 'busy'
    await get().syncLocationAndStatus(isOnline)
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
      const res = await acceptAssignment(accessToken, assignmentId)
      if (!res.ok) {
        console.log('Failed to accept order on backend:', res.error)
        return false
      }
      if (!res.data.success) {
        console.log('Failed to accept order on backend:', res.data.error ?? res.data.message)
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
    void get().refreshAssignments()
    return true
  },

  async rejectOrder(assignmentId) {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      const res = await rejectAssignment(accessToken, assignmentId, 'Courier skipped')
      if (!res.ok) {
        console.log('Failed to reject order on backend:', res.error)
        return false
      }
      if (!res.data.success) {
        console.log('Failed to reject order on backend:', res.data.error ?? res.data.message)
        return false
      }
    }
    set({
      showIncoming: false,
    })
    void get().refreshAssignments()
    return true
  },

  async advanceStage() {
    const { stage, activeAssignmentId } = get()
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken || !activeAssignmentId) return false

    if (stage === 'arrived') {
      const res = await apiUpdateAssignmentStatus(accessToken, activeAssignmentId, 'PICKED_UP')
      if (res.ok && res.data?.success) {
        set({ stage: 'pickedUp' })
        void get().refreshAssignments()
      } else {
        console.log('Failed to transition to PICKED_UP:', getRequestErrorMessage(res))
      }
      return false
    }

    if (stage === 'pickedUp') {
      const res = await apiUpdateAssignmentStatus(accessToken, activeAssignmentId, 'IN_TRANSIT')
      if (res.ok && res.data?.success) {
        set({ stage: 'onWay' })
        void get().refreshAssignments()
      } else {
        console.log('Failed to transition to IN_TRANSIT:', getRequestErrorMessage(res))
      }
      return false
    }

    if (stage === 'onWay') {
      const res = await apiUpdateAssignmentStatus(accessToken, activeAssignmentId, 'ARRIVED')
      if (res.ok && res.data?.success) {
        set({ stage: 'delivered' })
        void get().refreshAssignments()
      } else {
        console.log('Failed to transition to ARRIVED:', getRequestErrorMessage(res))
      }
      return false
    }

    return false
  },

  async verifyOTP(otpCode, assignmentId) {
    const targetAssignmentId = assignmentId || get().activeAssignmentId
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken || !targetAssignmentId) {
      return { success: false, message: 'No active assignment or credentials' }
    }

    const res = await verifyDeliveryCode(accessToken, targetAssignmentId, otpCode)
    if (res.ok && res.data?.success) {
      set({
        activeOrderId: null,
        activeAssignmentId: null,
        stage: 'arrived',
        status: 'online',
      })
      void get().refreshAssignments()
      return { success: true }
    } else {
      const errorMsg = getRequestErrorMessage(res) || (res.ok ? res.data.error?.message ?? res.data.message : undefined) || 'Invalid code'
      return { success: false, message: errorMsg }
    }
  },

  async cancelActiveOrder() {
    const { activeAssignmentId } = get()
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken && activeAssignmentId) {
      await apiUpdateAssignmentStatus(accessToken, activeAssignmentId, 'CANCELLED', undefined, 'Courier cancelled')
    }
    set({
      activeOrderId: null,
      activeAssignmentId: null,
      stage: 'arrived',
      status: 'online',
      showIncoming: false,
    })
    void get().refreshAssignments()
    return true
  },

  async endShift() {
    await get().syncLocationAndStatus(false)
  },

  setLocationPermissionStatus(status) {
    set({ locationPermissionStatus: status })
  },

  async syncLocationAndStatus(isOnline) {
    console.log('[ShiftStore] syncLocationAndStatus called for isOnline:', isOnline)
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) {
      console.warn('[ShiftStore] No access token found. Cannot sync status.')
      return false
    }

    if (isOnline) {
      set({ onlineTogglePending: true, locationSyncPending: true, locationSyncError: null })
      try {
        const permission = await requestLocationPermissions()
        set({ locationPermissionStatus: permission })

        if (permission !== 'granted') {
          console.warn('[ShiftStore] Location permission denied')
          set({
            isOnline: false,
            status: 'offline',
            locationSyncError: 'Location permission denied. Please enable location to go online.',
            onlineTogglePending: false,
            locationSyncPending: false,
          })
          return false
        }

        const coords = await getCurrentLocation()
        if (!coords) {
          console.warn('[ShiftStore] Could not retrieve GPS location')
          set({
            isOnline: false,
            status: 'offline',
            locationSyncError: 'Could not fetch device location. Check your GPS status.',
            onlineTogglePending: false,
            locationSyncPending: false,
          })
          return false
        }

        const res = await updateGPSLocation(accessToken, coords.latitude, coords.longitude, true)
        console.log('[ShiftStore] updateGPSLocation response ok:', res.ok)

        if (!res.ok || !res.data?.success) {
          const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
          console.warn('[ShiftStore] Failed to update location/status on backend:', errorMsg)
          set({
            isOnline: false,
            status: 'offline',
            locationSyncError: errorMsg || 'Backend failed to update online status',
            onlineTogglePending: false,
            locationSyncPending: false,
          })
          return false
        }

        set({
          isOnline: true,
          status: 'online',
          lastKnownLocation: coords,
          lastLocationSyncAt: Date.now(),
          locationSyncError: null,
          onlineTogglePending: false,
          locationSyncPending: false,
        })
        return true
      } catch (err) {
        console.error('[ShiftStore] Error going online:', err)
        set({
          isOnline: false,
          status: 'offline',
          locationSyncError: err instanceof Error ? err.message : 'Unknown error during status toggle',
          onlineTogglePending: false,
          locationSyncPending: false,
        })
        return false
      }
    } else {
      set({ onlineTogglePending: true, locationSyncError: null })
      try {
        const res = await toggleOnlineStatus(accessToken, false)
        console.log('[ShiftStore] toggleOnlineStatus (offline) response ok:', res.ok)

        if (!res.ok || !res.data?.success) {
          const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
          console.warn('[ShiftStore] Failed to set offline on backend:', errorMsg)
          set({
            locationSyncError: errorMsg || 'Backend failed to update offline status',
            onlineTogglePending: false,
          })
        }

        set({
          isOnline: false,
          status: 'offline',
          onlineTogglePending: false,
          showIncoming: false,
          activeOrderId: null,
          activeAssignmentId: null,
          stage: 'arrived',
        })
        void get().refreshAssignments()
        return true
      } catch (err) {
        console.error('[ShiftStore] Error going offline:', err)
        set({
          isOnline: false,
          status: 'offline',
          onlineTogglePending: false,
        })
        return true
      }
    }
  },

  async loadAssignments() {
    const accessToken = useAuthStore.getState().accessToken
    const courierId = useAuthStore.getState().courierId
    if (!accessToken || !courierId) {
      set({ error: 'No authenticated session or courier ID' })
      return
    }

    set({ loading: true, error: null })
    try {
      const res = await listMyAssignments(accessToken, courierId)
      if (!res.ok || !res.data?.success) {
        const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
        set({ error: errorMsg || 'Failed to fetch assignments', loading: false })
        return
      }

      const content = res.data.data?.content || []

      const pending = content.filter(a => a.assignmentStatus === 'PENDING')
      const active = content.filter(a =>
        ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(a.assignmentStatus)
      )
      const completed = content.filter(a =>
        ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(a.assignmentStatus)
      )

      const orderIdsToFetch = Array.from(new Set([
        ...pending.map(a => a.orderId),
        ...active.map(a => a.orderId),
        ...completed.slice(0, 5).map(a => a.orderId)
      ]))

      await Promise.all(orderIdsToFetch.map(orderId => get().fetchOrderDetails(orderId)))

      set({
        pendingAssignments: pending,
        activeAssignments: active,
        completedAssignments: completed,
        loading: false,
        lastFetchedAt: Date.now(),
      })
    } catch (err) {
      console.error('[ShiftStore] Error loading assignments:', err)
      set({
        error: err instanceof Error ? err.message : 'Unknown error fetching assignments',
        loading: false,
      })
    }
  },

  async refreshAssignments() {
    const accessToken = useAuthStore.getState().accessToken
    const courierId = useAuthStore.getState().courierId
    if (!accessToken || !courierId) {
      return
    }

    set({ refreshing: true, error: null })
    try {
      const res = await listMyAssignments(accessToken, courierId)
      if (res.ok && res.data?.success) {
        const content = res.data.data?.content || []
        const pending = content.filter(a => a.assignmentStatus === 'PENDING')
        const active = content.filter(a =>
          ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(a.assignmentStatus)
        )
        const completed = content.filter(a =>
          ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(a.assignmentStatus)
        )

        const orderIdsToFetch = Array.from(new Set([
          ...pending.map(a => a.orderId),
          ...active.map(a => a.orderId),
          ...completed.slice(0, 5).map(a => a.orderId)
        ]))

        await Promise.all(orderIdsToFetch.map(orderId => get().fetchOrderDetails(orderId)))

        set({
          pendingAssignments: pending,
          activeAssignments: active,
          completedAssignments: completed,
          lastFetchedAt: Date.now(),
        })
      }
    } catch (err) {
      console.error('[ShiftStore] Error refreshing assignments:', err)
    } finally {
      set({ refreshing: false })
    }
  },

  async loadPendingOffers() {
    const accessToken = useAuthStore.getState().accessToken
    const courierId = useAuthStore.getState().courierId
    if (!accessToken || !courierId) return

    try {
      const res = await listMyAssignments(accessToken, courierId, 'PENDING')
      if (res.ok && res.data?.success) {
        const pending = res.data.data?.content || []

        const orderIdsToFetch = pending.map(a => a.orderId)
        await Promise.all(orderIdsToFetch.map(orderId => get().fetchOrderDetails(orderId)))

        set({
          pendingAssignments: pending,
        })
      }
    } catch (err) {
      console.error('[ShiftStore] Error loading pending offers:', err)
    }
  },

  async fetchOrderDetails(orderId) {
    const { ordersCache } = get()
    if (ordersCache[orderId]) return

    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return

    try {
      const res = await getOrderDetails(accessToken, orderId)
      if (res.ok && res.data?.success && res.data?.data) {
        set({
          ordersCache: {
            ...get().ordersCache,
            [orderId]: res.data.data,
          }
        })
      }
    } catch (err) {
      console.warn(`[ShiftStore] Failed to fetch order details for ${orderId}:`, err)
    }
  },

  clearAssignmentsOnSignOut() {
    set({
      pendingAssignments: [],
      activeAssignments: [],
      completedAssignments: [],
      selectedAssignmentId: null,
      loading: false,
      refreshing: false,
      error: null,
      lastFetchedAt: null,
      ordersCache: {},
      actionPendingAssignmentId: null,
      actionError: null,
      statusMutationAssignmentId: null,
      statusMutationError: null,
      lastStatusUpdateAt: null,
      verifyingDeliveryCodeAssignmentId: null,
      deliveryCodeError: null,
      deliveryCodeVerifiedAt: null,
    })
  },

  async acceptAssignment(assignmentId) {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) {
      set({ actionError: 'No authenticated session' })
      return false
    }

    set({ actionPendingAssignmentId: assignmentId, actionError: null })
    try {
      const res = await acceptAssignment(accessToken, assignmentId)
      console.log('[ShiftStore] acceptAssignment result:', res.ok)

      if (!res.ok || !res.data?.success) {
        const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
        set({ actionError: errorMsg || 'Failed to accept assignment', actionPendingAssignmentId: null })
        return false
      }

      await get().refreshAssignmentAfterAction(assignmentId)

      const accepted = res.data.data
      if (accepted) {
        set({
          activeAssignmentId: accepted.id,
          activeOrderId: accepted.orderId,
          status: 'busy',
          stage: 'arrived',
        })
      }

      set({ actionPendingAssignmentId: null })
      return true
    } catch (err) {
      console.error('[ShiftStore] acceptAssignment exception:', err)
      set({
        actionError: err instanceof Error ? err.message : 'Unknown error during accept',
        actionPendingAssignmentId: null,
      })
      return false
    }
  },

  async rejectAssignment(assignmentId, reason) {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) {
      set({ actionError: 'No authenticated session' })
      return false
    }

    set({ actionPendingAssignmentId: assignmentId, actionError: null })
    try {
      const res = await rejectAssignment(accessToken, assignmentId, reason)
      console.log('[ShiftStore] rejectAssignment result:', res.ok)

      if (!res.ok || !res.data?.success) {
        const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
        set({ actionError: errorMsg || 'Failed to reject assignment', actionPendingAssignmentId: null })
        return false
      }

      if (get().activeAssignmentId === assignmentId) {
        set({
          activeAssignmentId: null,
          activeOrderId: null,
          status: 'online',
        })
      }

      await get().refreshAssignmentAfterAction(assignmentId)
      set({ actionPendingAssignmentId: null })
      return true
    } catch (err) {
      console.error('[ShiftStore] rejectAssignment exception:', err)
      set({
        actionError: err instanceof Error ? err.message : 'Unknown error during reject',
        actionPendingAssignmentId: null,
      })
      return false
    }
  },

  async refreshAssignmentAfterAction(assignmentId) {
    await get().refreshAssignments()

    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return

    try {
      const res = await getAssignment(accessToken, assignmentId)
      if (res.ok && res.data?.success && res.data?.data) {
        const assignment = res.data.data
        await get().fetchOrderDetails(assignment.orderId)
      }
    } catch (err) {
      console.warn(`[ShiftStore] Failed to refresh assignment details for ${assignmentId}:`, err)
    }
  },

  async updateAssignmentStatus(assignmentId, nextStatus, reason) {
    const accessToken = useAuthStore.getState().accessToken
    const courierId = useAuthStore.getState().courierId
    if (!accessToken) {
      set({ statusMutationError: 'No authenticated session' })
      return false
    }

    set({ statusMutationAssignmentId: assignmentId, statusMutationError: null })
    try {
      const res = await apiUpdateAssignmentStatus(
        accessToken,
        assignmentId,
        nextStatus,
        courierId || undefined,
        reason
      )
      console.log(`[ShiftStore] updateAssignmentStatus to ${nextStatus} result:`, res.ok)

      if (!res.ok || !res.data?.success) {
        const errorMsg = res.ok
          ? res.data?.error?.message ?? res.data?.message
          : res.error?.message
        set({
          statusMutationError: errorMsg || `Failed to update status to ${nextStatus}`,
          statusMutationAssignmentId: null,
        })
        return false
      }

      await get().refreshAssignmentAfterAction(assignmentId)

      const updated = res.data.data
      if (updated) {
        let localStage: ActiveStage = 'arrived'
        if (updated.assignmentStatus === 'PICKED_UP') localStage = 'pickedUp'
        else if (updated.assignmentStatus === 'IN_TRANSIT') localStage = 'onWay'
        else if (updated.assignmentStatus === 'ARRIVED') localStage = 'delivered'

        set({
          activeAssignmentId: updated.id,
          activeOrderId: updated.orderId,
          stage: localStage,
          status: updated.assignmentStatus === 'DELIVERED' ? 'online' : 'busy',
          lastStatusUpdateAt: Date.now(),
        })
      } else {
        set({
          lastStatusUpdateAt: Date.now(),
        })
      }

      set({ statusMutationAssignmentId: null })
      return true
    } catch (err) {
      console.error('[ShiftStore] updateAssignmentStatus exception:', err)
      set({
        statusMutationError: err instanceof Error ? err.message : 'Unknown error during status update',
        statusMutationAssignmentId: null,
      })
      return false
    }
  },

  async verifyDeliveryCode(assignmentId, confirmationCode) {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) {
      set({ deliveryCodeError: 'No authenticated session' })
      return false
    }

    set({
      verifyingDeliveryCodeAssignmentId: assignmentId,
      deliveryCodeError: null
    })

    try {
      const res = await verifyDeliveryCode(accessToken, assignmentId, confirmationCode)
      console.log('[ShiftStore] verifyDeliveryCode result:', res.ok)

      if (!res.ok || !res.data?.success) {
        const errorMsg = res.ok
          ? res.data?.error?.message ?? res.data?.message
          : res.error?.message
        set({
          deliveryCodeError: errorMsg || 'Invalid delivery confirmation code',
          verifyingDeliveryCodeAssignmentId: null
        })
        return false
      }

      set({
        deliveryCodeVerifiedAt: Date.now(),
        verifyingDeliveryCodeAssignmentId: null,
        activeOrderId: get().activeAssignmentId === assignmentId ? null : get().activeOrderId,
        activeAssignmentId: get().activeAssignmentId === assignmentId ? null : get().activeAssignmentId,
        status: get().activeAssignmentId === assignmentId ? 'online' : get().status
      })

      await get().refreshAssignmentAfterAction(assignmentId)
      return true
    } catch (err) {
      console.error('[ShiftStore] verifyDeliveryCode exception:', err)
      set({
        deliveryCodeError: err instanceof Error ? err.message : 'Unknown verification error',
        verifyingDeliveryCodeAssignmentId: null
      })
      return false
    }
  },

  async resendDeliveryCode(assignmentId) {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) return false
    try {
      const res = await resendDeliveryCode(accessToken, assignmentId)
      return res.ok && !!res.data?.success
    } catch (err) {
      console.error('[ShiftStore] resendDeliveryCode exception:', err)
      return false
    }
  },
}))

