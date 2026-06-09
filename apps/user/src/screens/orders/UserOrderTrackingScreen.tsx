import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { googleGeocode } from '../../data/googleMapsApi'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import MapView, { AnimatedRegion, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  getUserOrder,
  type UserOrder,
  type UserOrderAddress,
  getDeliveryConfirmationCode,
  mapOrderStatusToTrackingState,
  cancelOrder,
} from '../../data/ordersApi'
import { getOrderAssignment, getCourierLocation } from '../../data/logisticsApi'
import { apiRequest } from '../../data/apiClient'
import { decodeRoutePolyline } from '../../data/routesApi'

type UserOrderTrackingScreenProps = {
  accessToken?: string
  initialOrder: UserOrder
  onBackPress?: () => void
  onUnauthorized?: () => void
}

const progressSteps = [
  { key: 'confirmed', label: 'CONFIRMED' },
  { key: 'preparing', label: 'PICKED UP' },
  { key: 'onWay', label: 'ON THE WAY' },
  { key: 'arrived', label: 'ARRIVED' },
  { key: 'delivered', label: 'DELIVERED' },
] as const

const SERVICE_TYPE_LABEL: Record<string, string> = {
  FOOD: 'Food delivery',
  STANDARD: 'Courier',
  EXPRESS: 'Express',
  SCHEDULED: 'Scheduled',
}

const courierQuickReplies = ["I'm coming", 'Leave at door', 'Wait 5 min'] as const

type ChatMessage = {
  id: string
  text: string
  time: string
  sender: 'courier' | 'user'
  showAvatar?: boolean
}

const ASTANA_CENTER = { latitude: 51.1282, longitude: 71.4304 }
const ASTANA_DELIVERY_FALLBACK = { latitude: 51.14, longitude: 71.44 }

function formatAddress(address?: UserOrderAddress) {
  if (!address) return 'Address unavailable'
  const parts = [
    address.city?.trim(),
    address.street?.trim(),
    address.house?.trim(),
    address.entrance?.trim() ? `entrance ${address.entrance.trim()}` : '',
    address.floor?.trim() ? `floor ${address.floor.trim()}` : '',
    address.apartment?.trim() ? `apt ${address.apartment.trim()}` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Address unavailable'
}

function formatOrderCode(orderId?: string) {
  if (!orderId) return '#------'
  return `#${String(orderId).slice(0, 8).toUpperCase()}`
}

function isFoodOrder(order?: UserOrder) {
  if (!order) return false
  return order.serviceType === 'FOOD' || 
         !!order.companyId || 
         (!!order.comment && order.comment.includes('Food order from'))
}

function formatPrice(value: number, isFood?: boolean) {
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  if (isFood) {
    return `$${safeValue.toFixed(2)}`
  }
  return `${safeValue.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 2,
    maximumFractionDigits: 2,
  })} KZT`
}

function formatAmount(order: UserOrder) {
  const value =
    typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount)
      ? order.totalAmount
      : 0
  return formatPrice(value, isFoodOrder(order))
}

function formatCreatedAt(value?: string) {
  if (!value) return 'Unknown time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getAddressCoordinates(address?: UserOrderAddress | null) {
  if (!address) return null
  const latitude = Number(address.latitude)
  const longitude = Number(address.longitude)
  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) return null
  return { latitude, longitude }
}

async function geocodeAddress(address?: UserOrderAddress | null) {
  if (!address?.street?.trim()) return null
  const queries = [
    [address.street, address.house, address.city, 'Kazakhstan'].filter(Boolean).join(', '),
    [address.street, address.city, 'Kazakhstan'].filter(Boolean).join(', '),
    address.street.trim(),
  ]
  for (const query of queries) {
    try {
      const result = await googleGeocode(query)
      if (result) return result
    } catch {}
  }
  return null
}

function getOsrmProfile(transportType?: string): string {
  switch (transportType) {
    case 'FOOT':
      return 'foot'
    case 'BIKE':
    case 'SCOOTER':
      return 'cycling'
    case 'CAR':
    case 'VAN':
    default:
      return 'driving'
  }
}

async function fetchRouteCoordinates(
  origin: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number } | null,
  transportType?: string,
  accessToken?: string,
) {
  if (!origin || !destination) return []

  // 1. Try backend (Google Maps / premium route calculate) first, matching courier logic
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
        const decoded = decodeRoutePolyline(res.data.encodedPolyline, { lat: origin.latitude, lng: origin.longitude })
        if (decoded.length > 3) {
          return decoded
        }
      }
    } catch (err) {
      console.log('Failed to fetch premium route from backend for client:', err)
    }
  }

  // 2. Fallback to OSRM
  const profile = getOsrmProfile(transportType)
  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`OSRM ${response.status}`)
    const data = await response.json()
    const osrmCoords = data?.routes?.[0]?.geometry?.coordinates
    if (Array.isArray(osrmCoords)) {
      const coords = osrmCoords
        .filter((p: unknown) => Array.isArray(p) && p.length >= 2)
        .map((p: unknown) => {
          const [lng, lat] = p as [number, number]
          return { latitude: lat, longitude: lng }
        })
        .filter(p => isValidCoordinate(p.latitude) && isValidCoordinate(p.longitude))
      if (coords.length > 1) return coords
    }
  } catch {}
  return [origin, destination]
}

export function UserOrderTrackingScreen({
  accessToken,
  initialOrder,
  onBackPress,
  onUnauthorized,
}: UserOrderTrackingScreenProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  const topCoverHeight = insets.top + 78
  const collapsedHeight = 186 + Math.max(insets.bottom, 16)
  const expandedHeight = Math.min(height * 0.62, height - insets.top - 28)

  // ── Data state ──────────────────────────────────────────────────────────────
  const [order, setOrder] = useState<UserOrder>(initialOrder)
  const [isLoading, setIsLoading] = useState(true)
  const [resolvedCoords, setResolvedCoords] = useState<{
    pickup: { latitude: number; longitude: number } | null
    delivery: { latitude: number; longitude: number } | null
  }>({
    pickup: getAddressCoordinates(initialOrder.pickupAddress),
    delivery: getAddressCoordinates(initialOrder.deliveryAddress),
  })
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([])
  const [, setCourierId] = useState<string | null>(null)
  const [courierTransportType, setCourierTransportType] = useState<string | undefined>(undefined)
  const [realCourierLocation, setRealCourierLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [courierOnline, setCourierOnline] = useState(false)
  const [clientGpsCoords, setClientGpsCoords] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [assignmentEtaMinutes, setAssignmentEtaMinutes] = useState<number | null>(null)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false)
  const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false)
  const [isCourierChatVisible, setIsCourierChatVisible] = useState(false)
  const [isDeliveryCompleteVisible, setIsDeliveryCompleteVisible] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [chatDraft, setChatDraft] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // ── Animated values ───────────────────────────────────────────────────────────
  const mapRef = useRef<MapView | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const courierLocationInitialized = useRef(false)
  const courierMarker = useRef(
    new AnimatedRegion({
      latitude: ASTANA_CENTER.latitude,
      longitude: ASTANA_CENTER.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current

  const sheetHeight = useRef(new Animated.Value(expandedHeight)).current
  const progressValue = useRef(new Animated.Value(0)).current
  const utensilsBounce = useRef(new Animated.Value(0)).current
  const screenOpacity = useRef(new Animated.Value(0)).current
  const screenTranslateY = useRef(new Animated.Value(18)).current
  const completionOpacity = useRef(new Animated.Value(0)).current
  const completionTranslateY = useRef(new Animated.Value(24)).current
  const completionScale = useRef(new Animated.Value(0.82)).current
  const completionOuterPulse = useRef(new Animated.Value(0)).current
  const completionInnerPulse = useRef(new Animated.Value(0)).current
  const completionCheckBounce = useRef(new Animated.Value(0)).current

  // ── Computed / memoized ───────────────────────────────────────────────────────
  const trackingState = useMemo(() => mapOrderStatusToTrackingState(order.status), [order.status])

  const currentStatusUi = useMemo(() => {
    const s = (order.status || '').toUpperCase()
    const etaMode = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(s)
      ? 'delivered'
      : ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNMENT_PENDING'].includes(s)
        ? 'preparing'
        : 'liveRoute'
    return {
      title: trackingState.title,
      subtitle: trackingState.subtitle,
      accentColor: trackingState.statusColor,
      etaStatusText: trackingState.title,
      etaMode,
      highlightActiveLabel: etaMode === 'preparing',
      cardVariant: etaMode === 'delivered' ? ('delivered' as const) : ('eta' as const),
    }
  }, [trackingState, order.status])

  const completedStepCount = useMemo(() => {
    if (trackingState.isTerminal) return 0
    return trackingState.currentStep === 4 ? 5 : trackingState.currentStep
  }, [trackingState])

  const activeStepIndex = useMemo(() => {
    if (trackingState.isTerminal) return -1
    return trackingState.currentStep === 4 ? -1 : trackingState.currentStep
  }, [trackingState])

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['5%', '28%', '52%', '76%', '100%'],
  })

  const etaRange = useMemo(() => {
    if (currentStatusUi.etaMode === 'delivered') return '0'
    if (assignmentEtaMinutes != null && assignmentEtaMinutes > 0) return String(assignmentEtaMinutes)
    if (currentStatusUi.etaMode === 'preparing') return '15-25'
    const s = (order.status || '').toUpperCase()
    if (['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(s))
      return '10-15'
    return '20-30'
  }, [currentStatusUi.etaMode, order.status, assignmentEtaMinutes])

  const routeLineCoords = useMemo(() => {
    if (routeCoords.length > 1) return routeCoords
    if (resolvedCoords.pickup && resolvedCoords.delivery)
      return [resolvedCoords.pickup, resolvedCoords.delivery]
    return []
  }, [resolvedCoords, routeCoords])

  const showRoute = useMemo(
    () =>
      ['PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING', 'DELIVERED'].includes(
        (order.status || '').toUpperCase(),
      ),
    [order.status],
  )

  const showCourierMarker = useMemo(
    () =>
      realCourierLocation !== null &&
      ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(
        (order.status || '').toUpperCase(),
      ),
    [order.status, realCourierLocation],
  )

  const utensilsTranslateY = utensilsBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0],
  })

  const completionOuterScale = completionOuterPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.38],
  })
  const completionOuterOpacity = completionOuterPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.62, 0],
  })
  const completionInnerScale = completionInnerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1.22],
  })
  const completionInnerOpacity = completionInnerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.36, 0],
  })
  const completionCheckScale = completionCheckBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.14, 1],
  })

  const animatedCourierCoordinate = courierMarker as unknown as { latitude: number; longitude: number }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const animateProgressTo = useCallback(
    (step: number) => {
      Animated.timing(progressValue, {
        toValue: step,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    },
    [progressValue],
  )

  const toggleSheet = () => setIsCollapsed(c => !c)

  const handleCancelOrder = () => {
    if (!accessToken) return
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCanceling(true)
          try {
            const res = await cancelOrder(accessToken, order.orderId)
            if (res.ok && res.data?.success) {
              Alert.alert('Success', 'Order cancelled successfully.')
              setOrder(prev => ({ ...prev, status: 'CANCELLED' }))
            } else {
              const msg = res.ok ? res.data?.error?.message : (res as any).error?.message
              Alert.alert('Error', msg || 'Unable to cancel order.')
            }
          } catch {
            Alert.alert('Error', 'An unexpected error occurred.')
          } finally {
            setCanceling(false)
          }
        },
      },
    ])
  }

  const scrollChatToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true })
    })
  }, [])

  const pushUserChatMessage = useCallback((messageText: string) => {
    const normalized = messageText.trim()
    if (!normalized) return
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setChatMessages(current => [
      ...current,
      { id: `user-${Date.now()}`, text: normalized, time, sender: 'user' },
    ])
    setChatDraft('')
  }, [])

  // ── Effects: data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setOrder(prev =>
      prev && prev.orderId === initialOrder.orderId ? prev : initialOrder,
    )
  }, [initialOrder])

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    let isActive = true
    let pollTimer: ReturnType<typeof setTimeout>

    const poll = async (isInitial = false) => {
      if (isInitial) setIsLoading(true)
      try {
        const orderRes = await getUserOrder(accessToken, initialOrder.orderId)
        if (!isActive) return

        if (!orderRes.ok) {
          if ((orderRes as any).error?.status === 401) {
            onUnauthorized?.()
            return
          }
          return
        }

        if (!orderRes.data.success) {
          if (orderRes.data.error?.code === 'UNAUTHORIZED') {
            onUnauthorized?.()
            return
          }
          return
        }

        const latestOrder = orderRes.data.data
        if (latestOrder) {
          let code: string | undefined
          if (latestOrder.status === 'DELIVERY_CONFIRMATION_PENDING') {
            const codeRes = await getDeliveryConfirmationCode(accessToken, initialOrder.orderId)
            if (codeRes.ok && codeRes.data?.success && codeRes.data?.data) {
              code = codeRes.data.data.deliveryConfirmationCode ?? undefined
            }
          }

          setOrder(prev => ({
            ...prev,
            ...latestOrder,
            deliveryConfirmationCode:
              latestOrder.status === 'DELIVERY_CONFIRMATION_PENDING'
                ? (code ?? latestOrder.deliveryConfirmationCode)
                : latestOrder.deliveryConfirmationCode,
          }))

          if (latestOrder.status === 'DELIVERED' && (initialOrder.status || '').toUpperCase() !== 'DELIVERED') {
            setIsDeliveryCompleteVisible(prev => {
              if (!prev) {
                completionOpacity.setValue(0)
                completionTranslateY.setValue(24)
                completionScale.setValue(0.82)
                Animated.parallel([
                  Animated.timing(completionOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                  Animated.timing(completionTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                  Animated.spring(completionScale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
                ]).start()
              }
              return true
            })
          }
        }

        const isTerminal = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(
          (latestOrder?.status || '').toUpperCase()
        )
        if (isTerminal) {
          setCourierId(null)
          setRealCourierLocation(null)
          return
        }

        const assignRes = await getOrderAssignment(accessToken, initialOrder.orderId)
        if (!isActive) return

        if (assignRes.ok && assignRes.data.success && assignRes.data.data) {
          const content = assignRes.data.data.content
          if (content && content.length > 0) {
            const activeAssign = content[0]
            if (activeAssign.etaMinutes != null) {
              setAssignmentEtaMinutes(activeAssign.etaMinutes)
            }
            if (activeAssign.courierId) {
              setCourierId(activeAssign.courierId)
              const locRes = await getCourierLocation(accessToken, activeAssign.courierId)
              if (!isActive) return
              if (locRes.ok && locRes.data.success && locRes.data.data) {
                const locData = locRes.data.data
                setRealCourierLocation(prev => {
                  if (
                    prev &&
                    prev.latitude === locData.latitude &&
                    prev.longitude === locData.longitude
                  )
                    return prev
                  return { latitude: locData.latitude, longitude: locData.longitude }
                })
                setCourierOnline(locData.isOnline)
                if (locData.transportType) {
                  setCourierTransportType(locData.transportType)
                }

                if (!courierLocationInitialized.current) {
                  courierLocationInitialized.current = true
                  courierMarker.setValue({
                    latitude: locData.latitude,
                    longitude: locData.longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                  })
                } else {
                  ;(courierMarker as any)
                    .timing({
                      latitude: locData.latitude,
                      longitude: locData.longitude,
                      latitudeDelta: 0,
                      longitudeDelta: 0,
                      duration: 1000,
                      useNativeDriver: false,
                    })
                    .start()
                }
              }
            }
          } else {
            setCourierId(null)
            setRealCourierLocation(null)
          }
        }
      } catch (err) {
        console.log('Error in tracking poll:', err)
      } finally {
        if (isInitial) setIsLoading(false)
        if (isActive) {
          pollTimer = setTimeout(() => void poll(), 5000)
        }
      }
    }

    void poll(true)
    return () => {
      isActive = false
      clearTimeout(pollTimer)
    }
  }, [accessToken, initialOrder.orderId, onUnauthorized])

  useEffect(() => {
    if (!accessToken) return
    let isMounted = true
    let locationSub: Location.LocationSubscription | null = null
    const startTracking = async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync()
        if (!isMounted || perm.status !== 'granted') return
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 5000 },
          loc => {
            if (isMounted)
              setClientGpsCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
          },
        )
      } catch {}
    }
    void startTracking()
    return () => {
      isMounted = false
      locationSub?.remove()
    }
  }, [accessToken])

  useEffect(() => {
    let isActive = true
    const loadCoordinates = async () => {
      const directPickup = getAddressCoordinates(order.pickupAddress)
      const directDelivery = getAddressCoordinates(order.deliveryAddress)

      let cachedCoords: {
        pickupLat?: number | null
        pickupLon?: number | null
        deliveryLat?: number | null
        deliveryLon?: number | null
      } | null = null

      try {
        const cached = await AsyncStorage.getItem(`order_${order.orderId}`)
        cachedCoords = cached ? JSON.parse(cached) : null
      } catch {
        cachedCoords = null
      }

      const cachedPickup =
        isValidCoordinate(cachedCoords?.pickupLat) && isValidCoordinate(cachedCoords?.pickupLon)
          ? { latitude: Number(cachedCoords!.pickupLat), longitude: Number(cachedCoords!.pickupLon) }
          : null

      const cachedDelivery =
        isValidCoordinate(cachedCoords?.deliveryLat) && isValidCoordinate(cachedCoords?.deliveryLon)
          ? {
              latitude: Number(cachedCoords!.deliveryLat),
              longitude: Number(cachedCoords!.deliveryLon),
            }
          : null

      const [geocodedPickup, geocodedDelivery] = await Promise.all([
        directPickup || cachedPickup ? Promise.resolve(null) : geocodeAddress(order.pickupAddress),
        directDelivery || cachedDelivery
          ? Promise.resolve(null)
          : geocodeAddress(order.deliveryAddress),
      ])

      if (!isActive) return
      setResolvedCoords({
        pickup: directPickup || cachedPickup || geocodedPickup || ASTANA_CENTER,
        delivery: directDelivery || cachedDelivery || geocodedDelivery || ASTANA_DELIVERY_FALLBACK,
      })
    }
    void loadCoordinates()
    return () => { isActive = false }
  }, [order])

  useEffect(() => {
    let isActive = true
    const status = (order.status || '').toUpperCase()
    const activeStatuses = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING', 'DELIVERED']
    if (!activeStatuses.includes(status)) {
      setRouteCoords([])
      return
    }
    const buildRoute = async () => {
      const origin = status === 'DELIVERED' ? resolvedCoords.pickup : (realCourierLocation ?? resolvedCoords.pickup)
      const dest = resolvedCoords.delivery
      const nextRoute = await fetchRouteCoordinates(origin, dest, courierTransportType, accessToken)
      if (isActive) setRouteCoords(nextRoute)
    }
    void buildRoute()
    return () => { isActive = false }
  }, [resolvedCoords, order.status, realCourierLocation, courierTransportType])

  useEffect(() => {
    if (!resolvedCoords.pickup && !resolvedCoords.delivery) return
    const status = order.status.toUpperCase()
    const courierInTransit = ['IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(status)
    const bottomPadding = isCollapsed ? 176 : 360
    const coordsToFit = [
      courierInTransit && realCourierLocation ? realCourierLocation : resolvedCoords.pickup,
      resolvedCoords.delivery,
      clientGpsCoords,
    ].filter((c): c is { latitude: number; longitude: number } => c !== null && c !== undefined)
    if (coordsToFit.length === 0) return
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordsToFit, {
        edgePadding: {
          top: topCoverHeight + 20,
          right: 56,
          bottom: bottomPadding,
          left: 56,
        },
        animated: true,
      })
    }, 320)
    return () => clearTimeout(timer)
  }, [topCoverHeight, isCollapsed, resolvedCoords, realCourierLocation, clientGpsCoords, order.status])

  // ── Effects: UI animations ────────────────────────────────────────────────────
  useEffect(() => {
    screenOpacity.setValue(0)
    screenTranslateY.setValue(18)
    progressValue.setValue(0)
    Animated.parallel([
      Animated.timing(screenOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(screenTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    Animated.timing(sheetHeight, {
      toValue: isCollapsed ? collapsedHeight : expandedHeight,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [isCollapsed, collapsedHeight, expandedHeight])

  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(utensilsBounce, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(utensilsBounce, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    bounceLoop.start()
    return () => bounceLoop.stop()
  }, [])

  useEffect(() => {
    animateProgressTo(trackingState.currentStep)
  }, [trackingState.currentStep, animateProgressTo])

  useEffect(() => {
    if (isCourierChatVisible) scrollChatToBottom()
  }, [chatMessages.length, isCourierChatVisible, scrollChatToBottom])

  useEffect(() => {
    if (!isDeliveryCompleteVisible) {
      completionOuterPulse.setValue(0)
      completionInnerPulse.setValue(0)
      completionCheckBounce.setValue(0)
      return
    }
    const outerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(completionOuterPulse, { toValue: 1, duration: 1650, easing: Easing.out(Easing.sin), useNativeDriver: true }),
        Animated.timing(completionOuterPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    const innerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(240),
        Animated.timing(completionInnerPulse, { toValue: 1, duration: 1320, easing: Easing.out(Easing.sin), useNativeDriver: true }),
        Animated.timing(completionInnerPulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    const checkBounce = Animated.loop(
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(completionCheckBounce, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(2.2)), useNativeDriver: true }),
        Animated.timing(completionCheckBounce, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
      ]),
    )
    outerLoop.start()
    innerLoop.start()
    checkBounce.start()
    return () => {
      outerLoop.stop()
      innerLoop.stop()
      checkBounce.stop()
    }
  }, [isDeliveryCompleteVisible])

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderStatusCard = () => {
    if (currentStatusUi.cardVariant === 'delivered') {
      const upperStatus = (order.status || '').toUpperCase()
      const isCancelled = ['CANCELLED', 'REJECTED'].includes(upperStatus)
      const title = isCancelled ? trackingState.title : 'Parcel delivered'
      const subtitle = isCancelled ? trackingState.subtitle : 'Your parcel has been delivered successfully!'
      const iconName = isCancelled ? (upperStatus === 'CANCELLED' ? 'x' : 'slash') : 'check'
      const iconColor = '#ffffff'

      return (
        <View style={[styles.etaCard, styles.deliveredCard, isCancelled && { backgroundColor: '#F2F4F6' }]}>
          <View style={styles.deliveredCopy}>
            <Text allowFontScaling={false} style={[styles.deliveredTitle, isCancelled && { color: '#191C1E' }]}>
              {title}
            </Text>
            <Text allowFontScaling={false} style={[styles.deliveredSubtitle, isCancelled && { color: '#58423C' }]}>
              {subtitle}
            </Text>
          </View>
          <View style={[styles.deliveredIconCircle, isCancelled && { backgroundColor: currentStatusUi.accentColor }]}>
            <Feather name={iconName} size={isCancelled ? 20 : 28} color={iconColor} />
          </View>
        </View>
      )
    }

    return (
      <View style={styles.etaCard}>
        <View style={styles.etaCopy}>
          <Text allowFontScaling={false} style={styles.etaLabel}>
            ESTIMATED ARRIVAL
          </Text>
          <View style={styles.etaValueRow}>
            <Text allowFontScaling={false} style={styles.etaValue}>
              {etaRange}
            </Text>
            <Text allowFontScaling={false} style={styles.etaUnit}>
              min
            </Text>
          </View>
          <View style={styles.noteRow}>
            <View style={[styles.noteDot, { backgroundColor: currentStatusUi.accentColor }]} />
            <Text
              allowFontScaling={false}
              style={[styles.noteText, { color: currentStatusUi.accentColor }]}
            >
              {currentStatusUi.etaStatusText}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.etaIcon, { transform: [{ translateY: utensilsTranslateY }] }]}>
          <MaterialCommunityIcons
            name={currentStatusUi.etaMode === 'preparing' ? 'package-variant-closed' : 'bike-fast'}
            size={currentStatusUi.etaMode === 'preparing' ? 22 : 24}
            color="#862208"
          />
        </Animated.View>
      </View>
    )
  }

  const getProgressLabelStyle = (index: number) => {
    if (index < completedStepCount) return styles.progressLabelComplete
    if (index === activeStepIndex && currentStatusUi.highlightActiveLabel)
      return styles.progressLabelPreparing
    return undefined
  }

  const renderAddressModal = () => (
    <Modal
      visible={isAddressModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsAddressModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressModalVisible(false)} />
        <View style={[styles.addressSheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.addressHandleWrap}>
            <View style={styles.addressHandle} />
          </View>
          <View style={styles.addressHeader}>
            <View style={styles.addressIconCircle}>
              <Feather name="navigation" size={16} color="#ff7a59" />
            </View>
            <View style={styles.addressTitleWrap}>
              <Text allowFontScaling={false} style={styles.addressTitle}>
                Delivery
              </Text>
              <Text allowFontScaling={false} style={styles.addressSubtitle}>
                {order.deliveryAddress?.street
                  ? formatAddress(order.deliveryAddress)
                  : 'Delivery address'}
              </Text>
            </View>
          </View>

          <View style={styles.addressGrid}>
            {[
              { label: 'ENTRANCE', value: order.deliveryAddress?.entrance },
              { label: 'APARTMENT', value: order.deliveryAddress?.apartment },
              { label: 'FLOOR', value: order.deliveryAddress?.floor },
              { label: 'DOOR CODE', value: order.deliveryAddress?.house },
            ].map(field => (
              <View key={field.label} style={styles.addressInfoCard}>
                <Text allowFontScaling={false} style={styles.addressInfoLabel}>
                  {field.label}
                </Text>
                <Text allowFontScaling={false} style={styles.addressInfoValue}>
                  {field.value || '—'}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsAddressModalVisible(false)}
            style={styles.addressCloseButton}
          >
            <Text allowFontScaling={false} style={styles.addressCloseText}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )

  const renderOrderDetailsModal = () => {
    const isFood = isFoodOrder(order)
    const itemsSubtotal = (order.items ?? []).reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)

    let subtotal = itemsSubtotal
    let deliveryFee = 0
    let serviceFee = 0
    let tax = 0
    let total = order.totalAmount ?? 0

    if (isFood) {
      const deliveryOption = order.serviceType?.toUpperCase()
      if (deliveryOption === 'EXPRESS') {
        deliveryFee = 3.50
      } else if (deliveryOption === 'SCHEDULED') {
        deliveryFee = 1.50
      } else {
        deliveryFee = 2.00
      }
      serviceFee = 1.00
      tax = Number((subtotal * 0.08).toFixed(2))
      total = subtotal + deliveryFee + serviceFee + tax
    } else {
      deliveryFee = order.serviceType === 'EXPRESS' ? 1000 : 500
      serviceFee = 150
      if (subtotal + deliveryFee + serviceFee > total && total > 0) {
        subtotal = Math.max(0, total - deliveryFee - serviceFee)
      }
      tax = Math.max(0, total - subtotal - deliveryFee - serviceFee)
    }

    return (
      <Modal
        visible={isOrderDetailsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsOrderDetailsVisible(false)}
      >
        <View style={styles.orderDetailsScreen}>
          <View style={[styles.orderDetailsHeader, { paddingTop: insets.top + 16 }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOrderDetailsVisible(false)}
              style={styles.orderDetailsHeaderAction}
            >
              <Feather name="arrow-left" size={18} color="#191c1e" />
            </Pressable>
            <Text allowFontScaling={false} style={styles.orderDetailsHeaderTitle}>
              Order Details
            </Text>
            <View style={styles.orderDetailsHeaderAction} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.orderDetailsContent,
              { paddingTop: insets.top + 80, paddingBottom: Math.max(insets.bottom, 16) + 32 },
            ]}
          >
            <View style={styles.detailsCard}>
              <View style={styles.detailsRow}>
                <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
                  ORDER NUMBER
                </Text>
                <Text allowFontScaling={false} style={styles.detailsOrderNumber}>
                  {formatOrderCode(order.orderId)}
                </Text>
              </View>
              <Text allowFontScaling={false} style={styles.detailsDate}>
                {formatCreatedAt(order.createdAt)}
              </Text>
              <View style={styles.detailsTotalRow}>
                <Text allowFontScaling={false} style={styles.detailsMutedText}>
                  Service Type
                </Text>
                <Text allowFontScaling={false} style={styles.detailsAccentTotal}>
                  {isFood ? 'Food delivery' : (SERVICE_TYPE_LABEL[order.serviceType ?? ''] ?? order.serviceType ?? 'Delivery')}
                </Text>
              </View>
              <View style={styles.detailsTotalRow}>
                <Text allowFontScaling={false} style={styles.detailsMutedText}>
                  Delivery Option
                </Text>
                <Text allowFontScaling={false} style={styles.detailsAccentTotal}>
                  {isFood
                    ? (order.serviceType === 'EXPRESS' ? 'Express Delivery' : order.serviceType === 'SCHEDULED' ? 'Scheduled Delivery' : 'Standard Delivery')
                    : 'Standard Courier'}
                </Text>
              </View>
            </View>

          {isFood ? (
            <>
              <View style={styles.detailsCard}>
                <Text allowFontScaling={false} style={styles.detailsBlockTitle}>
                  Restaurant & Delivery
                </Text>
                <View style={styles.detailsRouteBlock}>
                  <View style={styles.detailsRouteRow}>
                    <View style={styles.detailsFromDot} />
                    <View style={styles.detailsRouteText}>
                      <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                        RESTAURANT
                      </Text>
                      <Text allowFontScaling={false} style={styles.detailsAddressText}>
                        {order.pickupInfo?.name || 'Restaurant'}
                      </Text>
                      <Text allowFontScaling={false} style={styles.detailsAddressSubText}>
                        {formatAddress(order.pickupAddress)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRouteLine} />
                  <View style={styles.detailsRouteRow}>
                    <View style={styles.detailsToDot} />
                    <View style={styles.detailsRouteText}>
                      <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                        DELIVERY ADDRESS
                      </Text>
                      <Text allowFontScaling={false} style={styles.detailsAddressText}>
                        {formatAddress(order.deliveryAddress)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text allowFontScaling={false} style={styles.detailsBlockTitle}>
                  Items Ordered
                </Text>
                <View style={styles.itemsList}>
                  {(order.items ?? []).map((item, idx) => (
                    <View key={item.itemId || String(idx)} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text allowFontScaling={false} style={styles.itemQuantity}>
                          {item.quantity}x
                        </Text>
                        <Text allowFontScaling={false} style={styles.itemName}>
                          {item.name}
                        </Text>
                      </View>
                      <Text allowFontScaling={false} style={styles.itemPrice}>
                        {formatPrice((item.price ?? 0) * item.quantity, isFood)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text allowFontScaling={false} style={styles.detailsBlockTitle}>
                  Receipt Details
                </Text>
                <View style={styles.breakdownList}>
                  <View style={styles.breakdownRow}>
                    <Text allowFontScaling={false} style={styles.breakdownLabel}>Subtotal</Text>
                    <Text allowFontScaling={false} style={styles.breakdownValue}>{formatPrice(subtotal, isFood)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text allowFontScaling={false} style={styles.breakdownLabel}>Delivery Fee</Text>
                    <Text allowFontScaling={false} style={styles.breakdownValue}>{formatPrice(deliveryFee, isFood)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text allowFontScaling={false} style={styles.breakdownLabel}>Service Fee</Text>
                    <Text allowFontScaling={false} style={styles.breakdownValue}>{formatPrice(serviceFee, isFood)}</Text>
                  </View>
                  {tax > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text allowFontScaling={false} style={styles.breakdownLabel}>Tax & VAT</Text>
                      <Text allowFontScaling={false} style={styles.breakdownValue}>{formatPrice(tax, isFood)}</Text>
                    </View>
                  )}
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownTotalRow}>
                    <Text allowFontScaling={false} style={styles.breakdownTotalLabel}>Total Paid</Text>
                    <Text allowFontScaling={false} style={styles.breakdownTotalValue}>{formatPrice(total, isFood)}</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailsCard}>
                <View style={styles.detailsRouteBlock}>
                  <View style={styles.detailsRouteRow}>
                    <View style={styles.detailsFromDot} />
                    <View style={styles.detailsRouteText}>
                      <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                        FROM
                      </Text>
                      <Text allowFontScaling={false} style={styles.detailsAddressText}>
                        {formatAddress(order.pickupAddress)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRouteLine} />
                  <View style={styles.detailsRouteRow}>
                    <View style={styles.detailsToDot} />
                    <View style={styles.detailsRouteText}>
                      <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                        TO
                      </Text>
                      <Text allowFontScaling={false} style={styles.detailsAddressText}>
                        {formatAddress(order.deliveryAddress)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text allowFontScaling={false} style={styles.detailsBlockTitle}>
                  Contacts
                </Text>
                <View style={styles.detailsContactRow}>
                  <View style={styles.detailsContactBlock}>
                    <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
                      SENDER
                    </Text>
                    <Text allowFontScaling={false} style={styles.detailsContactName}>
                      {order.pickupInfo?.name?.trim() || 'Sender'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.detailsContactPhone}>
                      {order.pickupInfo?.phone?.trim() || '—'}
                    </Text>
                  </View>
                  <View style={styles.detailsContactBlock}>
                    <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
                      RECEIVER
                    </Text>
                    <Text allowFontScaling={false} style={styles.detailsContactName}>
                      {order.recipientInfo?.name?.trim() || 'Receiver'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.detailsContactPhone}>
                      {order.recipientInfo?.phone?.trim() || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {!isFood && (
            <View style={styles.detailsPaidCard}>
              <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
                TOTAL
              </Text>
              <Text allowFontScaling={false} style={styles.detailsPaidValue}>
                {formatAmount(order)}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

  const renderCourierChatModal = () => (
    <Modal
      visible={isCourierChatVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsCourierChatVisible(false)}
    >
      <KeyboardAvoidingView
        style={styles.chatScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.chatHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.chatHeaderLeft}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsCourierChatVisible(false)}
              style={styles.chatHeaderBack}
            >
              <Feather name="arrow-left" size={18} color="#191c1e" />
            </Pressable>
            <View style={styles.chatCourierMeta}>
              <View style={styles.chatAvatarWrap}>
                <View style={styles.chatAvatarPlaceholder}>
                  <MaterialCommunityIcons name="bike-fast" size={20} color="#a7391e" />
                </View>
                <View style={[styles.chatAvatarStatus, { backgroundColor: courierOnline ? '#4caf50' : '#9e9e9e' }]} />
              </View>
              <View style={styles.chatCourierTextWrap}>
                <Text allowFontScaling={false} style={styles.chatCourierName}>
                  Your Courier
                </Text>
                <Text allowFontScaling={false} style={styles.chatCourierStatus}>
                  {courierOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Call courier', 'Calling feature coming soon.')}
            style={styles.chatCallButton}
          >
            <Feather name="phone-call" size={16} color="#ff7a59" />
          </Pressable>
        </View>

        <ScrollView
          ref={chatScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.chatContent,
            { paddingTop: insets.top + 84, paddingBottom: 16 },
          ]}
        >
          {chatMessages.length === 0 ? (
            <View style={styles.chatEmptyWrap}>
              <Text allowFontScaling={false} style={styles.chatEmptyText}>
                No messages yet. Say hi to your courier!
              </Text>
            </View>
          ) : null}
          {chatMessages.map(message => {
            if (message.sender === 'courier') {
              return (
                <View key={message.id} style={styles.chatIncomingWrap}>
                  {message.showAvatar ? (
                    <View style={styles.chatAvatarSmall}>
                      <MaterialCommunityIcons name="bike-fast" size={14} color="#a7391e" />
                    </View>
                  ) : (
                    <View style={styles.chatAvatarSpacer} />
                  )}
                  <View>
                    <View style={styles.chatIncomingBubble}>
                      <Text allowFontScaling={false} style={styles.chatIncomingText}>
                        {message.text}
                      </Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.chatMetaText}>
                      {message.time}
                    </Text>
                  </View>
                </View>
              )
            }
            return (
              <View key={message.id} style={styles.chatOutgoingWrap}>
                <View style={styles.chatOutgoingBubble}>
                  <Text allowFontScaling={false} style={styles.chatOutgoingText}>
                    {message.text}
                  </Text>
                </View>
                <View style={styles.chatOutgoingMetaRow}>
                  <Text allowFontScaling={false} style={styles.chatMetaText}>
                    {message.time}
                  </Text>
                  <Feather name="check" size={10} color="#a7391e" />
                </View>
              </View>
            )
          })}
        </ScrollView>

        <View style={[styles.chatComposerShell, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chatQuickReplies}
          >
            {courierQuickReplies.map((reply, i) => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                onPress={() => pushUserChatMessage(reply)}
                style={[styles.chatReplyChip, i === 0 && styles.chatReplyChipPrimary]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.chatReplyText, i === 0 && styles.chatReplyTextPrimary]}
                >
                  {reply}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.chatComposerRow}>
            <TextInput
              value={chatDraft}
              onChangeText={setChatDraft}
              placeholder="Write a message..."
              placeholderTextColor="rgba(88, 66, 60, 0.60)"
              selectionColor="#ff7a59"
              style={styles.chatInput}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => pushUserChatMessage(chatDraft)}
              style={styles.chatSendButton}
            >
              <Feather name="send" size={14} color="#701500" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )

  const renderDeliveryCompleteModal = () => (
    <Modal
      visible={isDeliveryCompleteVisible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsDeliveryCompleteVisible(false)}
    >
      <View style={styles.completionScreen}>
        <Animated.View
          style={[
            styles.completionContent,
            { opacity: completionOpacity, transform: [{ translateY: completionTranslateY }] },
          ]}
        >
          <Animated.View style={[styles.completionHeroWrap, { transform: [{ scale: completionScale }] }]}>
            <Animated.View
              style={[styles.completionGlowPrimary, { opacity: completionOuterOpacity, transform: [{ scale: completionOuterScale }] }]}
            />
            <Animated.View
              style={[styles.completionGlowSecondary, { opacity: completionInnerOpacity, transform: [{ scale: completionInnerScale }] }]}
            />
            <View style={styles.completionHeroCircle}>
              <Animated.View style={{ transform: [{ scale: completionCheckScale }] }}>
                <Feather name="check" size={54} color="#ffffff" />
              </Animated.View>
            </View>
          </Animated.View>

          <View style={styles.completionTextBlock}>
            <Text allowFontScaling={false} style={styles.completionTitle}>
              Parcel delivered
            </Text>
            <Text allowFontScaling={false} style={styles.completionSubtitle}>
              Your parcel has been delivered.{' '}Thanks for{'\n'}choosing us!
            </Text>
          </View>

          <View style={styles.ratingCard}>
            <Text allowFontScaling={false} style={styles.ratingCardLabel}>
              RATE YOUR EXPERIENCE
            </Text>
            <View style={styles.ratingStarsRow}>
              {Array.from({ length: 5 }, (_, index) => {
                const val = index + 1
                const isFilled = val <= selectedRating
                return (
                  <Pressable
                    key={`rating-${val}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedRating(val)}
                    style={styles.ratingStarButton}
                  >
                    <MaterialCommunityIcons
                      name={isFilled ? 'star' : 'star-outline'}
                      size={30}
                      color={isFilled ? '#ffb648' : '#e0e3e5'}
                    />
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.completionActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  'Rating submitted',
                  `Thanks for your feedback${selectedRating > 0 ? ` (${selectedRating}/5)` : ''}!`,
                )
              }
              style={styles.completionPrimaryButton}
            >
              <Text allowFontScaling={false} style={styles.completionPrimaryButtonText}>
                Submit Rating
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setIsDeliveryCompleteVisible(false)
                onBackPress?.()
              }}
              style={styles.completionSecondaryButton}
            >
              <Text allowFontScaling={false} style={styles.completionSecondaryButtonText}>
                Close
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )

  const canCancel = ['NEW', 'PENDING', 'CONFIRMED', 'ASSIGNMENT_PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(
    (order.status || '').toUpperCase(),
  )

  const isPast = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(
    (order.status || '').toUpperCase(),
  )

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        onPress={() => { if (!isCollapsed) setIsCollapsed(true) }}
        initialRegion={{
          latitude: ASTANA_CENTER.latitude,
          longitude: ASTANA_CENTER.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {resolvedCoords.pickup ? (
          <Marker coordinate={resolvedCoords.pickup} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupMarkerHalo} />
            <View style={styles.pickupMarker} />
          </Marker>
        ) : null}

        {resolvedCoords.delivery ? (
          <Marker coordinate={resolvedCoords.delivery} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.destinationPin}>
              <View style={styles.destinationPinTip} />
            </View>
          </Marker>
        ) : null}

        {showRoute && routeLineCoords.length > 1 ? (
          <>
            <Polyline coordinates={routeLineCoords} strokeColor="#ffffff" strokeWidth={8} />
            <Polyline coordinates={routeLineCoords} strokeColor="#5f98ff" strokeWidth={4} />
          </>
        ) : null}

        {showCourierMarker ? (
          <Marker.Animated coordinate={animatedCourierCoordinate as any} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.courierMarker}>
              <View style={styles.courierDot} />
            </View>
          </Marker.Animated>
        ) : null}

        {clientGpsCoords ? (
          <Marker coordinate={clientGpsCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.clientGpsHalo}>
              <View style={styles.clientGpsMarker} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.headerBackground, { height: topCoverHeight }]} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBackPress} style={styles.headerAction}>
          <Feather name="arrow-left" size={18} color="#a7391e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Order Status
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Support', 'Support is coming soon.')}
          style={styles.headerAction}
        >
          <Feather name="help-circle" size={18} color="#a7391e" />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.sheetShell,
          { opacity: screenOpacity, transform: [{ translateY: screenTranslateY }] },
        ]}
      >
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
        >
          <Pressable accessibilityRole="button" onPress={toggleSheet} style={styles.handlePressable}>
            <View style={styles.handle} />
          </Pressable>

          {isCollapsed ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsCollapsed(false)}
              style={styles.collapsedContent}
            >
              {renderStatusCard()}
            </Pressable>
          ) : (
            <ScrollView
              style={styles.sheetScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {currentStatusUi.cardVariant !== 'delivered' ? (
                <View style={styles.titleBlock}>
                  <View style={styles.titleRow}>
                    <Text allowFontScaling={false} style={styles.title}>
                      {currentStatusUi.title}
                    </Text>
                    {isLoading ? <ActivityIndicator size="small" color="#a7391e" style={{ marginLeft: 8 }} /> : null}
                  </View>
                  <Text allowFontScaling={false} style={styles.subtitle}>
                    {currentStatusUi.subtitle}
                  </Text>
                </View>
              ) : null}

              {renderStatusCard()}

              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View style={styles.progressBase} />
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />

                  {progressSteps.map((step, index) => {
                    const isComplete = index < completedStepCount
                    const isActive = index === activeStepIndex

                    return (
                      <View key={step.key} style={styles.progressNodeWrap}>
                        <View
                          style={[
                            styles.progressNode,
                            isComplete && styles.progressNodeComplete,
                            isActive && styles.progressNodeActive,
                            isActive && {
                              backgroundColor: currentStatusUi.accentColor,
                              shadowColor: currentStatusUi.accentColor,
                            },
                          ]}
                        >
                          {isComplete ? <Feather name="check" size={11} color="#ffffff" /> : null}
                          {isActive && step.key === 'preparing' ? (
                            <Feather name="package" size={12} color="#ffffff" />
                          ) : null}
                          {isActive && step.key === 'onWay' ? (
                            <MaterialCommunityIcons name="bike-fast" size={14} color="#ffffff" />
                          ) : null}
                          {isActive && step.key === 'arrived' ? (
                            <Feather name="map-pin" size={12} color="#ffffff" />
                          ) : null}
                          {isActive && step.key === 'delivered' ? (
                            <Feather name="check" size={12} color="#ffffff" />
                          ) : null}
                        </View>
                      </View>
                    )
                  })}
                </View>

                <View style={styles.progressLabels}>
                  {progressSteps.map((step, index) => {
                    const isActive = index === activeStepIndex
                    return (
                      <Text
                        key={step.key}
                        allowFontScaling={false}
                        style={[
                          styles.progressLabel,
                          getProgressLabelStyle(index),
                          isActive &&
                            currentStatusUi.highlightActiveLabel &&
                            styles.progressLabelActive,
                          isActive &&
                            currentStatusUi.highlightActiveLabel && {
                              color: currentStatusUi.accentColor,
                            },
                        ]}
                      >
                        {step.label}
                      </Text>
                    )
                  })}
                </View>
              </View>

              {trackingState.showConfirmationCode ? (
                order.deliveryConfirmationCode ? (
                  <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Delivery confirmation code</Text>
                    <Text style={styles.codeValue}>{order.deliveryConfirmationCode}</Text>
                    <Text style={styles.codeSubtitle}>Share this code with your courier</Text>
                  </View>
                ) : (
                  <View style={styles.codeCardExpired}>
                    <Text style={styles.codeExpiredLabel}>Код истёк</Text>
                    <Text style={styles.codeExpiredHint}>
                      Попросите курьера отправить код повторно
                    </Text>
                  </View>
                )
              ) : null}

              <View style={styles.quickActions}>
                {!isPast && (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setIsCourierChatVisible(true)}
                      style={styles.quickAction}
                    >
                      <View style={[styles.quickIconCircle, styles.quickIconCourier]}>
                        <Feather name="phone-call" size={20} color="#862208" />
                      </View>
                      <Text allowFontScaling={false} style={styles.quickActionLabel}>
                        Contact{'\n'}courier
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setIsAddressModalVisible(true)}
                      style={styles.quickAction}
                    >
                      <View style={[styles.quickIconCircle, styles.quickIconAddress]}>
                        <Feather name="home" size={20} color="#004397" />
                      </View>
                      <Text allowFontScaling={false} style={styles.quickActionLabel}>
                        Address{'\n'}details
                      </Text>
                    </Pressable>
                  </>
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsOrderDetailsVisible(true)}
                  style={[
                    styles.quickAction,
                    isPast && {
                      flex: 0,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      width: '100%',
                      paddingVertical: 16,
                      backgroundColor: '#F2F4F6',
                      borderRadius: 20,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIconCircle,
                      styles.quickIconOrder,
                      isPast && { backgroundColor: '#E6E8EA', width: 40, height: 40, borderRadius: 20 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="clipboard-text-outline"
                      size={20}
                      color="#58423c"
                    />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.quickActionLabel,
                      isPast && { fontWeight: '800', fontSize: 15, color: '#191C1E', marginTop: 0 },
                    ]}
                  >
                    Order details
                  </Text>
                </Pressable>
              </View>

              <View style={styles.bottomActions}>
                {canCancel ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleCancelOrder}
                    disabled={canceling}
                    style={[styles.bottomButton, styles.secondaryButton, canceling && { opacity: 0.6 }]}
                  >
                    {canceling ? (
                      <ActivityIndicator color="#191c1e" size="small" />
                    ) : (
                      <Text allowFontScaling={false} style={styles.secondaryButtonText}>
                        Cancel order
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <View style={[styles.bottomButton, styles.secondaryButton]}>
                    <Text allowFontScaling={false} style={styles.secondaryButtonText}>
                      {formatOrderCode(order.orderId)}
                    </Text>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => Alert.alert('Support', 'Support chat is coming soon.')}
                  style={[styles.bottomButton, styles.primaryButton]}
                >
                  <Text allowFontScaling={false} style={styles.primaryButtonText}>
                    Support
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>

      {renderAddressModal()}
      {renderOrderDetailsModal()}
      {renderCourierChatModal()}
      {renderDeliveryCompleteModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  pickupMarkerHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(167, 57, 30, 0.28)',
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a7391e',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  destinationPin: {
    width: 24,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#a7391e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  destinationPinTip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  courierMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e5bba',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  courierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  clientGpsHalo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 91, 186, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientGpsMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1e5bba',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  sheetShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  handlePressable: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e0e3e5',
  },
  collapsedContent: {
    paddingTop: 8,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleBlock: {
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#191c1e',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '800',
  },
  subtitle: {
    color: '#58423c',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  etaCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(223, 192, 184, 0.18)',
  },
  deliveredCard: {
    minHeight: 132,
    alignItems: 'center',
    overflow: 'hidden',
  },
  etaCopy: {
    flex: 1,
    gap: 4,
  },
  deliveredCopy: {
    flex: 1,
    flexShrink: 1,
    gap: 10,
    paddingRight: 12,
  },
  deliveredTitle: {
    color: '#191c1e',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },
  deliveredSubtitle: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '400',
  },
  etaLabel: {
    color: '#58423c',
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.55,
    fontWeight: '400',
  },
  etaValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  etaValue: {
    color: '#191c1e',
    fontSize: 40,
    lineHeight: 40,
    fontWeight: '800',
  },
  etaUnit: {
    color: '#58423c',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  etaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 210, 0.40)',
    borderWidth: 1,
    borderColor: '#ffdAD2',
  },
  deliveredIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#446744',
    flexShrink: 0,
  },
  progressBlock: {
    marginTop: 22,
    gap: 16,
  },
  progressTrack: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBase: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d8e2ff',
  },
  progressFill: {
    position: 'absolute',
    left: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#4d7448',
  },
  progressNodeWrap: {
    width: 32,
    alignItems: 'center',
  },
  progressNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e0e3e5',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  progressNodeComplete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4d7448',
  },
  progressNodeActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressLabel: {
    flex: 1,
    color: 'rgba(88, 66, 60, 0.42)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressLabelComplete: {
    color: '#446744',
    fontWeight: '700',
  },
  progressLabelPreparing: {
    color: '#a7391e',
    fontWeight: '700',
  },
  progressLabelActive: {
    color: '#58423c',
    fontWeight: '700',
  },
  codeCard: {
    borderRadius: 20,
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#A7391E',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeValue: {
    color: '#A7391E',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 2,
  },
  codeSubtitle: {
    color: '#A7391E',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  codeCardExpired: {
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  codeExpiredLabel: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeExpiredHint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  quickIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconCourier: {
    backgroundColor: '#ffdAD2',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  quickIconAddress: {
    backgroundColor: '#d8e2ff',
    shadowColor: '#1e5bba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  quickIconOrder: {
    backgroundColor: '#eceef0',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  quickActionLabel: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.3,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomActions: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 16,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#e6e8ea',
  },
  primaryButton: {
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#862208',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  // ── Modals ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.18)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  addressSheet: {
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
  addressHandleWrap: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  addressHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    opacity: 0.6,
    backgroundColor: '#e0e3e5',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  addressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 218, 210, 0.40)',
  },
  addressTitleWrap: {
    flex: 1,
    gap: 8,
  },
  addressTitle: {
    color: '#191c1e',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  addressSubtitle: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  addressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  addressInfoCard: {
    width: '48%',
    minHeight: 84,
    padding: 16,
    borderRadius: 6,
    gap: 4,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addressInfoLabel: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  addressInfoValue: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  addressCloseButton: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  addressCloseText: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  orderDetailsScreen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  orderDetailsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
  },
  orderDetailsHeaderAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetailsHeaderTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  orderDetailsContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsMutedCaps: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  detailsOrderNumber: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  detailsDate: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailsMutedText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsAccentTotal: {
    color: '#a7391e',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  detailsBlockTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailsRouteBlock: {
    gap: 0,
  },
  detailsRouteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minHeight: 48,
  },
  detailsRouteLine: {
    width: 2,
    height: 16,
    backgroundColor: '#e5e7eb',
    marginLeft: 5,
  },
  detailsFromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff7a59',
    marginTop: 4,
    flexShrink: 0,
  },
  detailsToDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#a7391e',
    marginTop: 4,
    flexShrink: 0,
  },
  detailsRouteText: {
    flex: 1,
    gap: 2,
  },
  detailsSectionCaps: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  detailsAddressText: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  detailsContactRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailsContactBlock: {
    flex: 1,
    gap: 4,
  },
  detailsContactName: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  detailsContactPhone: {
    color: '#58423c',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  detailsPaidCard: {
    backgroundColor: '#fff3ee',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  detailsPaidValue: {
    color: '#a7391e',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  itemsList: {
    gap: 12,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemQuantity: {
    color: '#ff7a59',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  itemName: {
    color: '#191C1E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flex: 1,
  },
  itemPrice: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  detailsAddressSubText: {
    color: '#8D776F',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 2,
  },
  breakdownList: {
    gap: 8,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  breakdownValue: {
    color: '#191C1E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E6E8EA',
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTotalLabel: {
    color: '#191C1E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  breakdownTotalValue: {
    color: '#a7391e',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  // ── Chat ──────────────────────────────────────────────────────────────────────
  chatScreen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  chatHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCourierMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatAvatarWrap: {
    position: 'relative',
  },
  chatAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffdAD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatCourierTextWrap: {
    gap: 2,
  },
  chatCourierName: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  chatCourierStatus: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  chatCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 122, 89, 0.08)',
  },
  chatContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chatEmptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
  },
  chatEmptyText: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  chatIncomingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  chatAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffdAD2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chatAvatarSpacer: {
    width: 28,
  },
  chatIncomingBubble: {
    maxWidth: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  chatIncomingText: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  chatOutgoingWrap: {
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 4,
  },
  chatOutgoingBubble: {
    maxWidth: '75%',
    backgroundColor: '#ff7a59',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatOutgoingText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  chatOutgoingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatMetaText: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },
  chatComposerShell: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(228, 228, 231, 0.6)',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  chatQuickReplies: {
    gap: 8,
    paddingBottom: 4,
  },
  chatReplyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#f2f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatReplyChipPrimary: {
    backgroundColor: '#fff3ee',
  },
  chatReplyText: {
    color: '#191c1e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  chatReplyTextPrimary: {
    color: '#a7391e',
  },
  chatComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7f9fb',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chatInput: {
    flex: 1,
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    minHeight: 40,
    maxHeight: 100,
  },
  chatSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffdAD2',
  },
  // ── Delivery Complete ─────────────────────────────────────────────────────────
  completionScreen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  completionContent: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  completionHeroWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionGlowPrimary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4d7448',
  },
  completionGlowSecondary: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#4d7448',
  },
  completionHeroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#446744',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#446744',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 1,
  },
  completionTextBlock: {
    alignItems: 'center',
    gap: 8,
  },
  completionTitle: {
    color: '#191c1e',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  completionSubtitle: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  ratingCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  ratingCardLabel: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingStarButton: {
    padding: 4,
  },
  completionActions: {
    width: '100%',
    gap: 12,
  },
  completionPrimaryButton: {
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  completionPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  completionSecondaryButton: {
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    backgroundColor: '#e6e8ea',
  },
  completionSecondaryButtonText: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
})
