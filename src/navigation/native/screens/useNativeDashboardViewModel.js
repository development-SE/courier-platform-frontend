import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCourierPosition, getCourierProfile, getIncomingOrderPreview } from '../../../services/courierDataService'
import { useOrdersState, ORDER_STAGES } from '../../../state/OrdersContext'
import { useNativeAppNavigator } from '../useNativeAppNavigator'

const ORDER_STAGE_META = {
  [ORDER_STAGES.TO_PICKUP]: {
    chip: 'К отправителю',
    helper: 'Приезжайте к отправителю и подтвердите прибытие.',
    primaryAction: 'Я на месте',
  },
  [ORDER_STAGES.ARRIVED_PICKUP]: {
    chip: 'На месте',
    helper: 'Проверьте код получения и заберите посылки.',
    primaryAction: 'Забрал заказ',
  },
  [ORDER_STAGES.TO_CUSTOMER]: {
    chip: 'К получателю',
    helper: 'Следуйте по маршруту до адреса доставки.',
    primaryAction: 'Доставлено',
  },
}

export function useNativeDashboardViewModel() {
  const appNavigator = useNativeAppNavigator()
  const courier = getCourierProfile()
  const incomingOrder = getIncomingOrderPreview()
  const courierPosition = getCourierPosition()
  const [status, setStatus] = useState(courier.status)
  const [showIncoming, setShowIncoming] = useState(false)
  const [activating, setActivating] = useState(false)
  const onlineTimerRef = useRef(null)
  const incomingTimerRef = useRef(null)

  const {
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
  } = useOrdersState()

  const stageMeta = useMemo(() => {
    if (!hasActiveOrder || !activeOrder) return null

    const current = ORDER_STAGE_META[orderStage] ?? ORDER_STAGE_META[ORDER_STAGES.TO_PICKUP]
    const eta = orderStage === ORDER_STAGES.TO_CUSTOMER ? activeOrder.deliveryEta : activeOrder.pickupEta

    return {
      ...current,
      eta,
    }
  }, [activeOrder, hasActiveOrder, orderStage])

  useEffect(() => {
    if (hasActiveOrder && status !== 'busy') {
      setStatus('busy')
      return
    }

    if (!hasActiveOrder && status === 'busy') {
      setStatus('online')
    }
  }, [hasActiveOrder, status])

  useEffect(() => (
    () => {
      if (onlineTimerRef.current) {
        clearTimeout(onlineTimerRef.current)
      }
      if (incomingTimerRef.current) {
        clearTimeout(incomingTimerRef.current)
      }
    }
  ), [])

  const onToggleOnline = useCallback(() => {
    if (hasActiveOrder) return

    if (status === 'offline') {
      setActivating(true)
      onlineTimerRef.current = setTimeout(() => {
        setStatus('online')
        setActivating(false)
        incomingTimerRef.current = setTimeout(() => setShowIncoming(true), 1300)
      }, 800)
      return
    }

    setShowIncoming(false)
    setStatus('offline')
  }, [hasActiveOrder, status])

  const onAcceptIncoming = useCallback(() => {
    setShowIncoming(false)
    acceptIncomingOrder()
    setStatus('busy')
  }, [acceptIncomingOrder])

  const onSkipIncoming = useCallback(() => {
    setShowIncoming(false)
  }, [])

  const onOrderAction = useCallback(() => {
    const next = advanceOrderStage()
    if (next === 'delivered') {
      setStatus('online')
    }
  }, [advanceOrderStage])

  const onCancelOrder = useCallback(() => {
    cancelOrder()
    setStatus('online')
  }, [cancelOrder])

  const onOpenSlots = useCallback(() => {
    appNavigator.openSlots()
  }, [appNavigator])

  const onOpenSupport = useCallback(() => {
    appNavigator.openMessages()
  }, [appNavigator])

  const onOpenDiagnostics = useCallback(() => {
    appNavigator.openProfileIdentity()
  }, [appNavigator])

  const onOpenOrderDetails = useCallback(() => {
    if (!activeOrder?.id) return
    appNavigator.openOrderDetails(activeOrder.id)
  }, [activeOrder?.id, appNavigator])

  return {
    courier,
    incomingOrder,
    courierPosition,
    status,
    showIncoming,
    activating,
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    stageMeta,
    onToggleOnline,
    onAcceptIncoming,
    onSkipIncoming,
    onOrderAction,
    onCancelOrder,
    onOpenSlots,
    onOpenSupport,
    onOpenDiagnostics,
    onOpenOrderDetails,
  }
}
