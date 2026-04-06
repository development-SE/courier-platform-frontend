import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { fetchDashboardSnapshotFromCore } from '../../data/coreClient'
import { STAGE_META, useShiftStore } from '../../store/shiftStore'

type ActiveOrderCard = {
  id: string
  client: string
  pickupAddress: string
  deliveryAddress: string
  earnings: number
  distance: string
  estimatedMin: number
  pickupCode?: string | null
  comment?: string
  parcelsCount?: number
  payment?: string
}

function randomIncomingDelay() {
  return 2500 + Math.floor(Math.random() * 3500)
}

export function useDashboardModel() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-snapshot'],
    queryFn: fetchDashboardSnapshotFromCore,
  })

  const {
    status,
    activating,
    showIncoming,
    activeOrderId,
    stage,
    hydrateStatus,
    setStatus,
    setActivating,
    setShowIncoming,
    acceptOrder,
    advanceStage,
    cancelActiveOrder,
    endShift,
  } = useShiftStore(useShallow(state => ({
    status: state.status,
    activating: state.activating,
    showIncoming: state.showIncoming,
    activeOrderId: state.activeOrderId,
    stage: state.stage,
    hydrateStatus: state.hydrateStatus,
    setStatus: state.setStatus,
    setActivating: state.setActivating,
    setShowIncoming: state.setShowIncoming,
    acceptOrder: state.acceptOrder,
    advanceStage: state.advanceStage,
    cancelActiveOrder: state.cancelActiveOrder,
    endShift: state.endShift,
  })))

  const activateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const incomingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIncomingTimer = () => {
    if (!incomingTimerRef.current) return
    clearTimeout(incomingTimerRef.current)
    incomingTimerRef.current = null
  }

  const scheduleIncoming = (delayMs: number) => {
    clearIncomingTimer()
    incomingTimerRef.current = setTimeout(() => {
      const shift = useShiftStore.getState()
      if (shift.status !== 'online') return
      if (shift.activeOrderId) return
      shift.setShowIncoming(true)
    }, delayMs)
  }

  const incomingOrder = data?.incomingOrder ?? null

  useEffect(() => {
    if (!data?.courier) return
    hydrateStatus(data.courier.status)
  }, [data?.courier, hydrateStatus])

  useEffect(() => {
    return () => {
      if (activateTimerRef.current) clearTimeout(activateTimerRef.current)
      clearIncomingTimer()
    }
  }, [])

  const activeOrder: ActiveOrderCard | null = useMemo(() => {
    if (!activeOrderId) return null

    const seededOrder = (data?.orders ?? []).find(order => order.id === activeOrderId)
    if (seededOrder) {
      return {
        id: seededOrder.id,
        client: seededOrder.client,
        pickupAddress: seededOrder.pickupAddress,
        deliveryAddress: seededOrder.deliveryAddress,
        earnings: seededOrder.earnings,
        distance: incomingOrder?.distance ?? '0 km',
        estimatedMin: incomingOrder?.estimatedMin ?? 0,
        pickupCode: typeof seededOrder.pickupCode === 'string' ? seededOrder.pickupCode : null,
        comment: typeof seededOrder.comment === 'string' ? seededOrder.comment : '',
        parcelsCount: typeof seededOrder.parcelsCount === 'number' ? seededOrder.parcelsCount : undefined,
        payment: typeof seededOrder.payment === 'string' ? seededOrder.payment : undefined,
      }
    }

    if (incomingOrder && incomingOrder.id === activeOrderId) {
      return {
        id: incomingOrder.id,
        client: incomingOrder.client,
        pickupAddress: incomingOrder.pickupAddress,
        deliveryAddress: incomingOrder.deliveryAddress,
        earnings: incomingOrder.earnings,
        distance: incomingOrder.distance,
        estimatedMin: incomingOrder.estimatedMin,
        pickupCode: typeof incomingOrder.pickupCode === 'string' ? incomingOrder.pickupCode : null,
        comment: typeof incomingOrder.comment === 'string' ? incomingOrder.comment : '',
        parcelsCount: typeof incomingOrder.parcelsCount === 'number' ? incomingOrder.parcelsCount : undefined,
        payment: typeof incomingOrder.payment === 'string' ? incomingOrder.payment : undefined,
      }
    }

    return null
  }, [activeOrderId, data?.orders, incomingOrder])

  const hasActiveOrder = Boolean(activeOrder)
  const mapPosition = data?.courierPosition ?? [76.889709, 43.238293]

  const toggleOnline = () => {
    if (hasActiveOrder) return

    if (status === 'offline') {
      setActivating(true)
      clearIncomingTimer()
      activateTimerRef.current = setTimeout(() => {
        setStatus('online')
        setActivating(false)
        scheduleIncoming(1000)
      }, 700)
      return
    }

    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current)
      activateTimerRef.current = null
    }
    clearIncomingTimer()
    endShift()
  }

  const acceptIncoming = () => {
    clearIncomingTimer()

    if (!incomingOrder) {
      setShowIncoming(false)
      setStatus('online')
      return
    }

    acceptOrder(incomingOrder.id)
  }

  const skipIncoming = () => {
    setShowIncoming(false)
    const shift = useShiftStore.getState()
    if (shift.status !== 'online') return
    if (shift.activeOrderId) return
    scheduleIncoming(randomIncomingDelay())
  }

  const advanceStageWithQueue = () => {
    const completed = advanceStage()
    if (completed) {
      scheduleIncoming(1800)
    }
    return completed
  }

  const cancelActiveOrderWithQueue = () => {
    cancelActiveOrder()
    const shift = useShiftStore.getState()
    if (shift.status === 'online' && !shift.activeOrderId) {
      scheduleIncoming(1800)
    }
  }

  return {
    isLoading,
    courier: data?.courier ?? null,
    incomingOrder,
    activeOrder,
    status,
    activating,
    hasActiveOrder,
    showIncoming,
    mapPosition,
    stage,
    stageMeta: STAGE_META[stage],
    toggleOnline,
    acceptIncoming,
    skipIncoming,
    advanceStage: advanceStageWithQueue,
    cancelActiveOrder: cancelActiveOrderWithQueue,
  }
}
