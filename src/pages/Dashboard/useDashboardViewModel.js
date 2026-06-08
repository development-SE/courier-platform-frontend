import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMyCourierProfile } from '../../api/courierApi'
import { setOnlineStatus, updateMyLocation } from '../../api/locationApi'
import { fetchMyPendingAssignment, acceptAssignment, rejectAssignment } from '../../api/assignmentsApi'
import { fetchOrderById } from '../../api/ordersApi'
import { useOrderState } from './useOrderState'
import { preloadCourierMap } from '../../components/map/loadCourierMap'
import { useWebAppNavigator } from '../../navigation/useWebAppNavigator'

const LOCATION_INTERVAL_MS = 15_000
const POLL_INTERVAL_MS = 10_000

function normalizeIncomingOrder(assignment, order) {
  return {
    id: String(order.id ?? assignment.orderId),
    assignmentId: String(assignment.id),
    client: order.companyName || order.clientName || order.client || 'Клиент',
    pointsCount: 2,
    deliveryType: order.deliveryType || 'door_to_door',
    pickupAddress:
      order.pickupAddress?.street ||
      order.pickupAddressText ||
      order.originAddress ||
      'Адрес получения',
    deliveryAddress:
      order.deliveryAddress?.street ||
      order.deliveryAddressText ||
      order.destinationAddress ||
      'Адрес доставки',
    estimatedMin: assignment.etaMinutes || order.estimatedDurationMinutes || 30,
    earnings: order.courierFee || order.fee || order.totalAmount || 0,
    distance: order.distanceKm ? `${order.distanceKm} км` : '',
    priorityGain: 1,
    priorityLoss: 3,
    pickupCode: order.pickupCode || null,
    pickupDeadline: order.pickupDeadline || order.expectedPickupTime || '',
    deliveryDeadline: order.deliveryDeadline || order.expectedDeliveryTime || '',
    parcelsCount: order.parcelsCount || order.itemsCount || 1,
    payment: order.paymentMethod || order.payment || 'cashless',
    comment: order.notes || order.comment || '',
  }
}

export function useDashboardViewModel() {
  const appNavigator = useWebAppNavigator()

  const [courier, setCourier] = useState({
    id: '', name: 'Загрузка...', lastName: '', rating: 0,
    reviewCount: 0, score: 0, status: 'offline', park: '',
    courierType: null, // 'EMPLOYEE' | 'CONTRACTOR' | null while loading
  })

  const [status, setStatus] = useState('offline')
  const [incomingOrder, setIncomingOrder] = useState(null)
  const [showIncoming, setShowIncoming] = useState(false)
  const [activating, setActivating] = useState(false)
  const [shouldLoadMap, setShouldLoadMap] = useState(false)
  const locationIntervalRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const shownAssignmentIdRef = useRef(null)

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

  // Load courier profile on mount
  useEffect(() => {
    fetchMyCourierProfile()
      .then(profile => {
        setCourier(prev => ({
          ...prev,
          id: String(profile.id ?? ''),
          name: profile.firstName || prev.name,
          lastName: profile.lastName || prev.lastName,
          park: profile.companyId ? String(profile.companyId) : prev.park,
          courierType: profile.courierType ?? null,
        }))
      })
      .catch(() => {})
  }, [])

  // Keep online status in sync with active order
  useEffect(() => {
    if (hasActiveOrder && status !== 'busy') setStatus('busy')
    else if (!hasActiveOrder && status === 'busy') setStatus('online')
  }, [hasActiveOrder, status])

  // Preload map when going online
  useEffect(() => {
    if (status !== 'offline' || hasActiveOrder) {
      preloadCourierMap()
      setShouldLoadMap(true)
    }
  }, [status, hasActiveOrder])

  // Send GPS location to backend while online
  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        updateMyLocation(pos.coords.latitude, pos.coords.longitude, true).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  useEffect(() => {
    if (status === 'online' || status === 'busy') {
      sendLocation()
      locationIntervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL_MS)
    } else {
      clearInterval(locationIntervalRef.current)
    }
    return () => clearInterval(locationIntervalRef.current)
  }, [status, sendLocation])

  // Poll for ASSIGNED/PENDING orders from backend while courier is online and not busy
  const pollForAssignment = useCallback(async () => {
    if (!courier.courierType) return
    try {
      const statusToPoll = courier.courierType === 'EMPLOYEE' ? 'ASSIGNED' : 'PENDING'
      const assignment = await fetchMyPendingAssignment(statusToPoll)
      if (!assignment) return
      if (shownAssignmentIdRef.current === String(assignment.id)) return

      const order = await fetchOrderById(assignment.orderId)
      const normalized = normalizeIncomingOrder(assignment, order)
      shownAssignmentIdRef.current = String(assignment.id)

      if (courier.courierType === 'EMPLOYEE') {
        // Employees are auto-assigned — accept silently and activate order
        acceptAssignment(String(assignment.id)).catch(() => {})
        acceptIncomingOrder(normalized.id)
        setStatus('busy')
      } else {
        // Contractors see the incoming order popup and choose
        setIncomingOrder(normalized)
        setShowIncoming(true)
      }
    } catch {
      // fail silently
    }
  }, [courier.courierType, acceptIncomingOrder])

  useEffect(() => {
    if (status !== 'online') {
      clearInterval(pollIntervalRef.current)
      return
    }
    pollForAssignment()
    pollIntervalRef.current = setInterval(pollForAssignment, POLL_INTERVAL_MS)
    return () => clearInterval(pollIntervalRef.current)
  }, [status, pollForAssignment])

  const handleGoOnline = useCallback(() => {
    if (hasActiveOrder) return
    preloadCourierMap()

    if (status === 'offline') {
      setActivating(true)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            updateMyLocation(pos.coords.latitude, pos.coords.longitude, true)
              .then(() => setOnlineStatus(true))
              .catch(() => {})
          },
          () => { setOnlineStatus(true).catch(() => {}) },
          { enableHighAccuracy: true, timeout: 5000 },
        )
      } else {
        setOnlineStatus(true).catch(() => {})
      }
      setTimeout(() => {
        setStatus('online')
        setActivating(false)
      }, 800)
      return
    }

    setOnlineStatus(false).catch(() => {})
    updateMyLocation(0, 0, false).catch(() => {})
    clearInterval(pollIntervalRef.current)
    setStatus('offline')
    setShowIncoming(false)
    setIncomingOrder(null)
    shownAssignmentIdRef.current = null
  }, [hasActiveOrder, status])

  const handleAcceptIncoming = useCallback(() => {
    if (!incomingOrder) return
    const { id: orderId, assignmentId } = incomingOrder
    setShowIncoming(false)
    acceptAssignment(assignmentId).catch(() => {})
    acceptIncomingOrder(orderId)
    setStatus('busy')
  }, [incomingOrder, acceptIncomingOrder])

  const handleSkipIncoming = useCallback(() => {
    if (incomingOrder?.assignmentId) {
      rejectAssignment(incomingOrder.assignmentId).catch(() => {})
    }
    setShowIncoming(false)
    setIncomingOrder(null)
    shownAssignmentIdRef.current = null
  }, [incomingOrder])

  const handleOrderAction = useCallback(() => {
    const next = advanceOrderStage()
    if (next === 'delivered') setStatus('online')
  }, [advanceOrderStage])

  const handleCancelOrder = useCallback(() => {
    cancelOrder()
    setStatus('online')
  }, [cancelOrder])

  const openSlots = useCallback(() => appNavigator.openSlots(), [appNavigator])
  const openSupport = useCallback(() => appNavigator.openMessages(), [appNavigator])
  const openDiagnostics = useCallback(() => appNavigator.openProfileIdentity(), [appNavigator])

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
