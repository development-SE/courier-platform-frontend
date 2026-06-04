import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { fetchDashboardSnapshotFromCore } from '../../data/coreClient'
import { STAGE_META, useShiftStore } from '../../store/shiftStore'
import { useAuthStore } from '../../store/authStore'
import {
  listMyAssignments,
  updateGPSLocation,
  getOrderDetails,
  type OrderResponse,
} from '../../data/logisticsApi'
import { getCurrentLocation } from '../../platform/location'

type ActiveOrderCard = {
  id: string
  orderId: string
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

export function useDashboardModel() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-snapshot'],
    queryFn: fetchDashboardSnapshotFromCore,
  })

  const accessToken = useAuthStore(state => state.accessToken)
  const courierId = useAuthStore(state => state.courierId)

  const {
    status,
    activating,
    showIncoming,
    activeOrderId,
    activeAssignmentId,
    stage,
    hydrateStatus,
    setStatus,
    setActivating,
    setShowIncoming,
    acceptOrder,
    rejectOrder,
    advanceStage,
    verifyOTP,
    cancelActiveOrder,
    endShift,

    isOnline,
    lastKnownLocation,
    lastLocationSyncAt,
    locationPermissionStatus,
    locationSyncError,
    onlineTogglePending,
    locationSyncPending,

    pendingAssignments,
    activeAssignments,
    completedAssignments,
    loadAssignments,
    refreshAssignments,
  } = useShiftStore(useShallow(state => ({
    status: state.status,
    activating: state.activating,
    showIncoming: state.showIncoming,
    activeOrderId: state.activeOrderId,
    activeAssignmentId: state.activeAssignmentId,
    stage: state.stage,
    hydrateStatus: state.hydrateStatus,
    setStatus: state.setStatus,
    setActivating: state.setActivating,
    setShowIncoming: state.setShowIncoming,
    acceptOrder: state.acceptOrder,
    rejectOrder: state.rejectOrder,
    advanceStage: state.advanceStage,
    verifyOTP: state.verifyOTP,
    cancelActiveOrder: state.cancelActiveOrder,
    endShift: state.endShift,

    isOnline: state.isOnline,
    lastKnownLocation: state.lastKnownLocation,
    lastLocationSyncAt: state.lastLocationSyncAt,
    locationPermissionStatus: state.locationPermissionStatus,
    locationSyncError: state.locationSyncError,
    onlineTogglePending: state.onlineTogglePending,
    locationSyncPending: state.locationSyncPending,

    pendingAssignments: state.pendingAssignments,
    activeAssignments: state.activeAssignments,
    completedAssignments: state.completedAssignments,
    loadAssignments: state.loadAssignments,
    refreshAssignments: state.refreshAssignments,
  })))

  const [realIncoming, setRealIncoming] = useState<any>(null)
  const [activeOrderDetails, setActiveOrderDetails] = useState<OrderResponse | null>(null)

  // ASTANA default coordinates
  const [gpsLocation, setGpsLocation] = useState({
    latitude: 51.1282,
    longitude: 71.4304,
  })

  // Poll for incoming orders when online
  useEffect(() => {
    if (!accessToken || !courierId || status !== 'online') {
      setRealIncoming(null)
      setShowIncoming(false)
      return
    }

    let isMounted = true
    const checkIncoming = async () => {
      try {
        const res = await listMyAssignments(accessToken, courierId, 'ASSIGNED')
        if (!isMounted) return

        if (res.ok && res.data?.success && res.data?.data?.content && res.data.data.content.length > 0) {
          const firstAssign = res.data.data.content[0]

          // Get order details
          const orderRes = await getOrderDetails(accessToken, firstAssign.orderId)
          if (!isMounted) return

          if (orderRes.ok && orderRes.data?.success && orderRes.data?.data) {
            const orderData = orderRes.data.data
            setRealIncoming({
              id: firstAssign.id, // assignmentId
              orderId: firstAssign.orderId,
              client: orderData.recipientInfo?.name || 'Customer',
              pickupAddress: orderData.pickupAddress?.street || 'Astana Store',
              deliveryAddress: orderData.deliveryAddress?.street || 'Delivery Address',
              earnings: 1200,
              distance: '2.4 km',
              estimatedMin: 15,
              pickupCode: orderData.deliveryConfirmationCode || '',
              comment: orderData.comment || '',
              parcelsCount: 1,
              payment: 'Cashless',
            })
            setShowIncoming(true)
          }
        } else {
          setRealIncoming(null)
          setShowIncoming(false)
        }
      } catch (err) {
        console.log('Error checking incoming assignments:', err)
      }
    }

    void checkIncoming()
    const timer = setInterval(() => void checkIncoming(), 4000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [accessToken, courierId, status, setShowIncoming])

  // Poll active order details when busy
  useEffect(() => {
    if (!accessToken || !activeOrderId || status !== 'busy') {
      setActiveOrderDetails(null)
      return
    }

    let isMounted = true
    const fetchDetails = async () => {
      try {
        const res = await getOrderDetails(accessToken, activeOrderId)
        if (isMounted && res.ok && res.data?.success && res.data?.data) {
          setActiveOrderDetails(res.data.data)
        }
      } catch (err) {
        console.log('Error fetching active order details:', err)
      }
    }

    void fetchDetails()
    const timer = setInterval(() => void fetchDetails(), 5000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [accessToken, activeOrderId, status])

  // Periodic GPS Updater using real device location
  useEffect(() => {
    if (!accessToken || status === 'offline') {
      return
    }

    const updateLocation = async () => {
      try {
        useShiftStore.setState({ locationSyncPending: true })
        const coords = await getCurrentLocation()
        if (coords) {
          const res = await updateGPSLocation(accessToken, coords.latitude, coords.longitude, true)
          if (res.ok && res.data?.success) {
            useShiftStore.setState({
              lastKnownLocation: coords,
              lastLocationSyncAt: Date.now(),
              locationSyncError: null,
              locationSyncPending: false,
            })
            setGpsLocation(coords)
          } else {
            const errorMsg = res.ok ? res.data?.error?.message ?? res.data?.message : res.error?.message
            useShiftStore.setState({
              locationSyncError: errorMsg || 'Failed to sync location to backend',
              locationSyncPending: false,
            })
          }
        } else {
          useShiftStore.setState({
            locationSyncError: 'GPS location unavailable. Verify location settings are turned on.',
            locationSyncPending: false,
          })
        }
        void refreshAssignments()
      } catch (err) {
        console.error('[useDashboardModel] Location sync failed:', err)
        useShiftStore.setState({
          locationSyncError: err instanceof Error ? err.message : 'Unknown error during location sync',
          locationSyncPending: false,
        })
      }
    }

    void updateLocation()
    const timer = setInterval(() => void updateLocation(), 8000)

    return () => {
      clearInterval(timer)
    }
  }, [accessToken, status])

  // Eager load assignments on mount or session hydration
  useEffect(() => {
    if (accessToken && courierId) {
      void loadAssignments()
    }
  }, [accessToken, courierId])

  useEffect(() => {
    if (!data?.courier) return
    hydrateStatus(data.courier.status)
  }, [data?.courier, hydrateStatus])

  const incomingOrder = realIncoming

  const activeOrder: ActiveOrderCard | null = useMemo(() => {
    if (!activeOrderId || !activeOrderDetails) return null

    return {
      id: activeAssignmentId || activeOrderId,
      orderId: activeOrderId,
      client: activeOrderDetails.recipientInfo?.name || 'Customer',
      pickupAddress: activeOrderDetails.pickupAddress?.street || 'Restaurant Address',
      deliveryAddress: activeOrderDetails.deliveryAddress?.street || 'Delivery Address',
      earnings: 1200,
      distance: '2.4 km',
      estimatedMin: 15,
      pickupCode: activeOrderDetails.deliveryConfirmationCode || '',
      comment: activeOrderDetails.comment || '',
      parcelsCount: 1,
      payment: 'Cashless',
    }
  }, [activeOrderId, activeAssignmentId, activeOrderDetails])

  const hasActiveOrder = Boolean(activeOrder)

  const mapPosition: [number, number] = useMemo(() => {
    if (lastKnownLocation) {
      return [lastKnownLocation.longitude, lastKnownLocation.latitude]
    }
    return [gpsLocation.longitude, gpsLocation.latitude]
  }, [lastKnownLocation, gpsLocation])

  const toggleOnline = () => {
    if (hasActiveOrder || onlineTogglePending) return

    if (status === 'offline') {
      setStatus('online')
    } else {
      endShift()
    }
  }

  const acceptIncoming = () => {
    if (!incomingOrder) {
      setShowIncoming(false)
      setStatus('online')
      return
    }

    acceptOrder(incomingOrder.id, incomingOrder.orderId).then((success) => {
      if (!success) {
        setStatus('online')
      }
    }).catch(err => {
      console.log('Error accepting assignment:', err)
      setStatus('online')
    })
  }

  const skipIncoming = () => {
    if (incomingOrder) {
      rejectOrder(incomingOrder.id).catch(err => {
        console.log('Error rejecting assignment:', err)
      })
    }
    setShowIncoming(false)
  }

  return {
    isLoading,
    courier: data?.courier ?? null,
    incomingOrder,
    activeOrder,
    status,
    activating: activating || onlineTogglePending,
    hasActiveOrder,
    showIncoming,
    mapPosition,
    stage,
    stageMeta: STAGE_META[stage],
    toggleOnline,
    acceptIncoming,
    skipIncoming,
    advanceStage,
    cancelActiveOrder,
    verifyOTP,

    isOnline,
    lastKnownLocation,
    lastLocationSyncAt,
    locationPermissionStatus,
    locationSyncError,
    onlineTogglePending,
    locationSyncPending,

    pendingAssignments,
    activeAssignments,
    completedAssignments,
    loadAssignments,
    refreshAssignments,
  }
}
