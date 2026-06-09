import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import * as Notifications from 'expo-notifications'
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
import { apiRequest } from '../../data/apiClient'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type ActiveOrderCard = {
  id: string
  orderId: string
  client: string
  clientPhone?: string
  serviceType?: string
  pickupAddress: string
  deliveryAddress: string
  earnings: number
  distance: string
  estimatedMin: number
  pickupCode?: string | null
  comment?: string
  parcelsCount?: number
  payment?: string
  pickupCoordinates?: { latitude: number; longitude: number } | null
  deliveryCoordinates?: { latitude: number; longitude: number } | null
}

function decodePolyline(str: string, origin?: { latitude: number; longitude: number } | null) {
  const decoded5 = decodePolylineWithPrecision(str, 5)
  if (!origin || decoded5.length === 0) {
    return decoded5
  }

  const first5 = decoded5[0]
  const dist5 = Math.abs(first5.latitude - origin.latitude) + Math.abs(first5.longitude - origin.longitude)

  const decoded6 = decodePolylineWithPrecision(str, 6)
  const first6 = decoded6[0]
  const dist6 = Math.abs(first6.latitude - origin.latitude) + Math.abs(first6.longitude - origin.longitude)

  return dist6 < dist5 ? decoded6 : decoded5
}

function decodePolylineWithPrecision(str: string, precision: number) {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [],
    shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change,
    factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push({
      latitude: lat / factor,
      longitude: lng / factor
    });
  }

  return coordinates;
}

async function fetchRouteCoordinates(
  origin: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number } | null,
  accessToken?: string | null,
) {
  if (!origin || !destination) {
    return []
  }

  // 1. Try backend (Google Maps / premium route calculate) first
  if (accessToken) {
    try {
      const res = await apiRequest<{ encodedPolyline: string }>('/api/routes/calculate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json: {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
        },
      })

      if (res.ok && res.data?.encodedPolyline) {
        const decoded = decodePolyline(res.data.encodedPolyline, origin)
        if (decoded.length > 3) {
          return decoded
        }
      }
    } catch (err) {
      console.log('Failed to fetch premium route from backend:', err)
    }
  }

  // 2. Fall back to OSRM (free, no API key)
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`OSRM request failed with status ${response.status}`)
    }

    const data = await response.json()
    const osrmCoordinates = data?.routes?.[0]?.geometry?.coordinates

    if (Array.isArray(osrmCoordinates)) {
      const coords = osrmCoordinates
        .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
        .map((point: unknown) => {
          const [longitude, latitude] = point as [number, number]
          return { latitude, longitude }
        })
      if (coords.length > 1) {
        return coords
      }
    }
  } catch {
    // Fall back to straight line when routing is unavailable.
  }

  return [origin, destination]
}

function formatAddress(addr: any) {
  if (!addr) return ''
  let parts = []
  if (addr.street) {
    parts.push(addr.street)
  }
  if (addr.house) {
    parts.push(addr.house)
  }
  let details = []
  if (addr.entrance) {
    details.push(`п. ${addr.entrance}`)
  }
  if (addr.floor) {
    details.push(`${addr.floor} эт.`)
  }
  if (addr.apartment) {
    details.push(`кв. ${addr.apartment}`)
  }
  if (details.length > 0) {
    return `${parts.join(', ')} (${details.join(', ')})`
  }
  return parts.join(', ')
}

export function useDashboardModel() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-snapshot'],
    queryFn: fetchDashboardSnapshotFromCore,
  })

  const accessToken = useAuthStore(state => state.accessToken)
  const courierId = useAuthStore(state => state.courierId)
  const courierProfile = useAuthStore(state => state.courierProfile)

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

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted')
      }
    }
    void requestPermissions()
  }, [])

  const prevIncomingIdRef = useRef<string | null>(null)

  // Trigger local notification when a new order is assigned
  useEffect(() => {
    if (realIncoming?.id) {
      if (realIncoming.id !== prevIncomingIdRef.current) {
        prevIncomingIdRef.current = realIncoming.id
        void Notifications.scheduleNotificationAsync({
          content: {
            title: 'Новый заказ!',
            body: `Клиент: ${realIncoming.client}. Доставка: ${realIncoming.deliveryAddress}`,
            data: { orderId: realIncoming.orderId, assignmentId: realIncoming.id },
          },
          trigger: null,
        })
      }
    } else {
      prevIncomingIdRef.current = null
    }
  }, [realIncoming])

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
        const pollStatus = courierProfile?.courierType === 'CONTRACTOR' ? 'PENDING' : 'ASSIGNED'
        const res = await listMyAssignments(accessToken, courierId, pollStatus)
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
              pickupAddress: formatAddress(orderData.pickupAddress) || 'Astana Store',
              deliveryAddress: formatAddress(orderData.deliveryAddress) || 'Delivery Address',
              earnings: orderData.totalAmount || 1200,
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
  }, [accessToken, courierId, status, courierProfile?.courierType, setShowIncoming])

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
      clientPhone: activeOrderDetails.recipientInfo?.phone || '',
      serviceType: activeOrderDetails.serviceType || 'Standard',
      pickupAddress: formatAddress(activeOrderDetails.pickupAddress) || 'Restaurant Address',
      deliveryAddress: formatAddress(activeOrderDetails.deliveryAddress) || 'Delivery Address',
      earnings: activeOrderDetails.totalAmount || 1200,
      distance: '2.4 km',
      estimatedMin: 15,
      pickupCode: activeOrderDetails.deliveryConfirmationCode || '',
      comment: activeOrderDetails.comment || '',
      parcelsCount: 1,
      payment: 'Cashless',
      pickupCoordinates: activeOrderDetails.pickupAddress?.latitude && activeOrderDetails.pickupAddress?.longitude
        ? { latitude: Number(activeOrderDetails.pickupAddress.latitude), longitude: Number(activeOrderDetails.pickupAddress.longitude) }
        : null,
      deliveryCoordinates: activeOrderDetails.deliveryAddress?.latitude && activeOrderDetails.deliveryAddress?.longitude
        ? { latitude: Number(activeOrderDetails.deliveryAddress.latitude), longitude: Number(activeOrderDetails.deliveryAddress.longitude) }
        : null,
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

  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([])

  // Dynamic Route calculation
  useEffect(() => {
    if (!activeOrder) {
      setRouteCoords([])
      return
    }

    const courierLoc = lastKnownLocation ?? gpsLocation
    if (!courierLoc) return

    let destination = activeOrder.pickupCoordinates
    if (stage === 'onWay' || stage === 'delivered') {
      destination = activeOrder.deliveryCoordinates
    }

    if (!destination) {
      setRouteCoords([])
      return
    }

    let isMounted = true
    const calculate = async () => {
      const coords = await fetchRouteCoordinates(courierLoc, destination, accessToken)
      if (isMounted) {
        setRouteCoords(coords)
      }
    }

    void calculate()

    return () => {
      isMounted = false
    }
  }, [activeOrder, lastKnownLocation, gpsLocation, stage, accessToken])

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
    routeCoords,

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
