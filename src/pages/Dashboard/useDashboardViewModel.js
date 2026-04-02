import { useCallback, useEffect, useState } from 'react'
import { getCourierProfile, getIncomingOrderPreview } from '../../services/courierDataService'
import { useOrderState } from './useOrderState'
import { preloadCourierMap } from '../../components/map/loadCourierMap'
import { useWebAppNavigator } from '../../navigation/useWebAppNavigator'

export function useDashboardViewModel() {
  const appNavigator = useWebAppNavigator()
  const courier = getCourierProfile()
  const incomingOrder = getIncomingOrderPreview()
  const [status, setStatus] = useState(courier.status) // 'offline' | 'online' | 'busy'
  const [showIncoming, setShowIncoming] = useState(false)
  const [activating, setActivating] = useState(false)
  const [shouldLoadMap, setShouldLoadMap] = useState(false)

  const {
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    stageMeta,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
  } = useOrderState()

  useEffect(() => {
    if (hasActiveOrder && status !== 'busy') {
      setStatus('busy')
      return
    }

    if (!hasActiveOrder && status === 'busy') {
      setStatus('online')
    }
  }, [hasActiveOrder, status])

  useEffect(() => {
    if (status !== 'offline' || hasActiveOrder) {
      preloadCourierMap()
      setShouldLoadMap(true)
    }
  }, [status, hasActiveOrder])

  const handleGoOnline = useCallback(() => {
    if (hasActiveOrder) return
    preloadCourierMap()

    if (status === 'offline') {
      setActivating(true)
      setTimeout(() => {
        setStatus('online')
        setActivating(false)
        setTimeout(() => setShowIncoming(true), 1500)
      }, 800)
      return
    }

    setStatus('offline')
  }, [hasActiveOrder, status])

  const handleAcceptIncoming = useCallback(() => {
    setShowIncoming(false)
    acceptIncomingOrder()
    setStatus('busy')
  }, [acceptIncomingOrder])

  const handleSkipIncoming = useCallback(() => {
    setShowIncoming(false)
  }, [])

  const handleOrderAction = useCallback(() => {
    const next = advanceOrderStage()
    if (next === 'delivered') {
      setStatus('online')
    }
  }, [advanceOrderStage])

  const handleCancelOrder = useCallback(() => {
    cancelOrder()
    setStatus('online')
  }, [cancelOrder])

  const openSlots = useCallback(() => {
    appNavigator.openSlots()
  }, [appNavigator])

  const openSupport = useCallback(() => {
    appNavigator.openMessages()
  }, [appNavigator])

  const openDiagnostics = useCallback(() => {
    appNavigator.openProfileIdentity()
  }, [appNavigator])

  return {
    courier,
    incomingOrder,
    status,
    showIncoming,
    activating,
    shouldLoadMap,
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    stageMeta,
    setShouldLoadMap,
    onToggleOnline: handleGoOnline,
    onAcceptIncoming: handleAcceptIncoming,
    onSkipIncoming: handleSkipIncoming,
    onOrderAction: handleOrderAction,
    onCancelOrder: handleCancelOrder,
    onOpenSlots: openSlots,
    onOpenSupport: openSupport,
    onOpenDiagnostics: openDiagnostics,
    onMapIntent: preloadCourierMap,
  }
}
