import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import MapView, {
  AnimatedRegion,
  LatLng,
  Marker,
  Polyline as MapPolyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import * as Location from 'expo-location'
import { googleGeocode } from '../../data/googleMapsApi'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { calculateRoute, decodeRoutePolyline, RoutePoint } from '../../data/routesApi'
import { getUserOrder, mapOrderStatusToTrackingState, type UserOrder, type TrackingState, updateOrderAddress, type UserOrderAddress, cancelOrder } from '../../data/ordersApi'
import { getOrderAssignment, getCourierLocation, getCourierDetails } from '../../data/logisticsApi'

type OrderStatusScreenProps = {
  accessToken?: string
  orderId?: string
  restaurantName: string
  orderNumber: string
  total: number
  orderedItems: {
    id: string
    name: string
    price: number
    image: string
    quantity: number
  }[]
  onBackPress?: () => void
  onReorder?: (items: { id: string; quantity: number }[]) => void
}



type EtaMode = 'preparing' | 'liveRoute' | 'delivered'
const MOCK_COURIER_NAME = 'Aman'

const restaurantLocation = {
  latitude: 51.1282,
  longitude: 71.4304,
}

const customerLocation = {
  latitude: 51.1350,
  longitude: 71.4450,
}

const courierStartLocation = {
  latitude: 51.1200,
  longitude: 71.4200,
}

const progressSteps = [
  { key: 'confirmed', label: 'CONFIRMED' },
  { key: 'preparing', label: 'PREPARING' },
  { key: 'onWay', label: 'ON THE WAY' },
  { key: 'arrived', label: 'ARRIVED' },
  { key: 'delivered', label: 'DELIVERED' },
] as const

const addressFields = [
  { key: 'house', label: 'HOUSE' },
  { key: 'entrance', label: 'ENTRANCE' },
  { key: 'apartment', label: 'APARTMENT' },
  { key: 'doorCode', label: 'DOOR CODE' },
] as const

const courierAvatarUri =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'

const statusPresentation: Record<
  string,
  {
    title: string
    subtitle: string
    accentColor: string
    milestoneIndex: number
    etaStatusText: string
    etaMode: EtaMode
    highlightActiveLabel: boolean
    cardVariant: 'eta' | 'delivered'
  }
> = {
  NEW: {
    title: 'Confirmed your order',
    subtitle: 'Your order has been received and is being processed',
    accentColor: '#a7391e',
    milestoneIndex: 0,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  ACCEPTED: {
    title: 'Confirmed your order',
    subtitle: 'Your order has been received and is being processed',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  PREPARING: {
    title: 'Preparing your order',
    subtitle: 'The restaurant is preparing your food',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  READY: {
    title: 'Order is ready',
    subtitle: 'Your food is ready and waiting for the courier',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  ASSIGNMENT_PENDING: {
    title: 'Finding a courier',
    subtitle: 'We are searching for a nearby courier to deliver your food',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  ASSIGNED: {
    title: `Courier ${MOCK_COURIER_NAME} is assigned`,
    subtitle: 'Courier is heading to the restaurant',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  PICKED_UP: {
    title: `Courier ${MOCK_COURIER_NAME} picked up your food`,
    subtitle: 'Courier is on the way to your address',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  IN_TRANSIT: {
    title: `Courier ${MOCK_COURIER_NAME} is on the way`,
    subtitle: 'Courier is delivering your food',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  DELIVERY_CONFIRMATION_PENDING: {
    title: 'Courier has arrived',
    subtitle: 'Please share the delivery confirmation code with your courier',
    accentColor: '#a7391e',
    milestoneIndex: 3,
    etaStatusText: 'Arrived',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  DELIVERED: {
    title: 'Order delivered',
    subtitle: 'Your order has been delivered! Please take a moment to rate your experience.',
    accentColor: '#446744',
    milestoneIndex: 4,
    etaStatusText: 'Delivered successfully',
    etaMode: 'delivered',
    highlightActiveLabel: false,
    cardVariant: 'delivered',
  },
  CANCELLED: {
    title: 'Order cancelled',
    subtitle: 'This order has been cancelled',
    accentColor: '#6B7280',
    milestoneIndex: 0,
    etaStatusText: 'Cancelled',
    etaMode: 'delivered',
    highlightActiveLabel: false,
    cardVariant: 'delivered',
  },
  REJECTED: {
    title: 'Order rejected',
    subtitle: 'This order has been rejected',
    accentColor: '#EF4444',
    milestoneIndex: 0,
    etaStatusText: 'Rejected',
    etaMode: 'delivered',
    highlightActiveLabel: false,
    cardVariant: 'delivered',
  },
}

const hasGoogleMapsKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
const SIMULATION_TICK_MS = 1300

export function OrderStatusScreen({
  accessToken,
  orderId,
  restaurantName,
  orderNumber,
  total,
  orderedItems,
  onBackPress,
  onReorder,
}: OrderStatusScreenProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>(() =>
    accessToken && orderId ? [] : [courierStartLocation, restaurantLocation, customerLocation]
  )
  const [distanceMeters, setDistanceMeters] = useState(4200)
  const [durationSeconds, setDurationSeconds] = useState(50 * 60)
  const [orderStatus, setOrderStatus] = useState<string>('NEW')
  const [orderData, setOrderData] = useState<UserOrder | null>(null)
  const [cancellationInfo, setCancellationInfo] = useState<{
    whoCancelled: 'User' | 'Courier' | 'System'
    reason: string
  } | null>(null)
  const [courierId, setCourierId] = useState<string | null>(null)
  const [courierPhone, setCourierPhone] = useState<string | null>(null)
  const [courierName, setCourierName] = useState<string | null>(null)
  const [realCourierLocation, setRealCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [courierOnline, setCourierOnline] = useState<boolean>(false)
  const [clientGpsCoords, setClientGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [hasRealDeliveryCoords, setHasRealDeliveryCoords] = useState(false)
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null)
  const [showPushNotification, setShowPushNotification] = useState<boolean>(false)
  const pushAnim = useRef(new Animated.Value(-160)).current
  const [restaurantCoords, setRestaurantCoords] = useState(restaurantLocation)
  const [customerCoords, setCustomerCoords] = useState(customerLocation)
  const [milestoneIndex, setMilestoneIndex] = useState(1)
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false)
  const isAddressModalVisibleRef = useRef(false)
  isAddressModalVisibleRef.current = isAddressModalVisible
  const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false)
  const [isDeliveryCompleteVisible, setIsDeliveryCompleteVisible] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [addressDetails, setAddressDetails] = useState({
    house: '',
    entrance: '',
    apartment: '',
    doorCode: '',
  })
  const [deliveryAddress, setDeliveryAddress] = useState<UserOrderAddress | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  const openAddressModal = () => {
    if (deliveryAddress) {
      setAddressDetails(prev => ({
        house: deliveryAddress.house || '',
        entrance: deliveryAddress.entrance || '',
        apartment: deliveryAddress.apartment || '',
        doorCode: prev.doorCode,
      }))
    }
    setIsAddressModalVisible(true)
  }

  const handleSaveAddress = async () => {
    if (!accessToken || !orderId) {
      setIsAddressModalVisible(false)
      Alert.alert('Success', 'Address updated successfully (mock mode)')
      return
    }

    try {
      const res = await updateOrderAddress(accessToken, orderId, {
        house: addressDetails.house,
        entrance: addressDetails.entrance,
        apartment: addressDetails.apartment,
      })

      if (res.ok) {
        if (res.data.success) {
          setIsAddressModalVisible(false)
          Alert.alert('Success', 'Address updated successfully')
          setDeliveryAddress(prev => prev ? {
            ...prev,
            house: addressDetails.house,
            entrance: addressDetails.entrance,
            apartment: addressDetails.apartment,
          } : null)
        } else {
          const errorMsg = res.data.error?.message || 'Failed to update address'
          Alert.alert('Error', errorMsg)
        }
      } else {
        const errorMsg = res.error?.message || 'Failed to update address'
        Alert.alert('Error', errorMsg)
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while updating address')
    }
  }

  const handleCancelOrder = () => {
    if (!accessToken || !orderId) {
      Alert.alert('Cancel Order', 'Cancel order is not available in mock mode.')
      return
    }

    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setIsCanceling(true)
          try {
            const res = await cancelOrder(accessToken, orderId, 'User cancelled')
            if (res.ok && res.data?.success) {
              Alert.alert('Success', 'Order cancelled successfully.')
              setOrderStatus('CANCELLED')
              if (orderData) {
                setOrderData({
                  ...orderData,
                  status: 'CANCELLED',
                })
              }
            } else {
              const msg = res.ok ? res.data?.error?.message : (res as any).error?.message
              Alert.alert('Error', msg || 'Unable to cancel order.')
            }
          } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred.')
          } finally {
            setIsCanceling(false)
          }
        },
      },
    ])
  }

  const mapRef = useRef<MapView | null>(null)
  const courierMarker = useRef(
    new AnimatedRegion({
      latitude: courierStartLocation.latitude,
      longitude: courierStartLocation.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current
  const screenOpacity = useRef(new Animated.Value(0)).current
  const screenTranslateY = useRef(new Animated.Value(18)).current
  const sheetHeight = useRef(new Animated.Value(Math.min(height * 0.62, height - insets.top - 28))).current
  const progressValue = useRef(new Animated.Value(0)).current
  const utensilsBounce = useRef(new Animated.Value(0)).current
  const completionOpacity = useRef(new Animated.Value(0)).current
  const completionTranslateY = useRef(new Animated.Value(24)).current
  const completionScale = useRef(new Animated.Value(0.82)).current
  const completionOuterPulse = useRef(new Animated.Value(0)).current
  const completionInnerPulse = useRef(new Animated.Value(0)).current
  const completionCheckBounce = useRef(new Animated.Value(0)).current
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const courierLocationInitialized = useRef(false)

  const topCoverHeight = insets.top + 78
  const collapsedHeight = 186 + Math.max(insets.bottom, 16)
  const expandedHeight = Math.min(height * 0.62, height - insets.top - 28)
  const routeFitPadding = useMemo(
    () => ({
      top: topCoverHeight + 24,
      right: 42,
      bottom: collapsedHeight + 34,
      left: 42,
    }),
    [collapsedHeight, topCoverHeight],
  )

  const trackingState = useMemo(() => mapOrderStatusToTrackingState(orderStatus), [orderStatus])

  const currentStatusUi = useMemo(() => {
    const s = orderStatus.toUpperCase()
    const meta = statusPresentation[s] || statusPresentation.NEW

    return {
      title: meta.title,
      subtitle: meta.subtitle,
      accentColor: meta.accentColor,
      milestoneIndex: meta.milestoneIndex,
      etaStatusText: meta.etaStatusText,
      etaMode: meta.etaMode,
      highlightActiveLabel: meta.highlightActiveLabel,
      cardVariant: meta.cardVariant,
    }
  }, [orderStatus])

  const animatedCourierCoordinate = courierMarker as unknown as LatLng

  const isRealMode = Boolean(accessToken && orderId)
  const upperStatus = orderStatus.toUpperCase()
  const inTransitStatuses = ['IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING']
  const withCourierStatuses = ['ASSIGNED', 'PICKED_UP', ...inTransitStatuses]
  const showCourierMarker = !isRealMode
    ? true
    : realCourierLocation !== null && withCourierStatuses.includes(upperStatus)
  // In real mode, show client's actual GPS position as their marker
  const showClientMarker = isRealMode && clientGpsCoords !== null
  // Delivery address marker (destination pin) - separate from client GPS
  const showDeliveryMarker = !isRealMode
    ? true
    : hasRealDeliveryCoords
  const showPickupMarker = !isRealMode
  // Route: courier → delivery address (only shown after pickup)
  const showRoute = !isRealMode
    ? true
    : (realCourierLocation !== null || restaurantCoords !== null) && hasRealDeliveryCoords && ['PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(upperStatus)

  const completedStepCount = useMemo(() => {
    if (trackingState.isTerminal) {
      return 0
    }
    return trackingState.currentStep === 4 ? 5 : trackingState.currentStep
  }, [trackingState])

  const activeStepIndex = useMemo(() => {
    if (trackingState.isTerminal) {
      return -1
    }
    return trackingState.currentStep === 4 ? -1 : trackingState.currentStep
  }, [trackingState])

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['5%', '28%', '52%', '76%', '100%'],
  })

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

  const etaRange = useMemo(() => {
    if (currentStatusUi.etaMode === 'delivered') {
      return '0-5'
    }

    if (currentStatusUi.etaMode === 'preparing') {
      return '25-35'
    }

    const s = orderStatus.toUpperCase()
    if (
      ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(s)
    ) {
      return '10-15'
    }

    const minutes = Math.max(5, Math.ceil(durationSeconds / 60))
    const lower = Math.max(0, minutes - 5)
    const upper = minutes + 5
    return `${lower}-${upper}`
  }, [currentStatusUi.etaMode, orderStatus, durationSeconds])

  const initialRegion = useMemo(() => {
    const latitude = (restaurantCoords.latitude + customerCoords.latitude) / 2
    const longitude = (restaurantCoords.longitude + customerCoords.longitude) / 2

    return {
      latitude,
      longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }
  }, [restaurantCoords, customerCoords])

  const placedAtText = useMemo(() => {
    const now = new Date()
    const datePart = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    return `${datePart} at ${timePart}`
  }, [])

  const normalizedOrderNumber = useMemo(() => {
    const raw = orderNumber.replace('#', '')
    return raw.includes('-') ? `#${raw}` : `#260425-${raw.padStart(7, '0')}`
  }, [orderNumber])

  const orderItems = useMemo(
    () =>
      orderedItems.length > 0
        ? orderedItems
        : [
            {
              id: 'fallback-burger',
              name: 'Mix Cheese Burger',
              price: 24,
              image:
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=256&q=80',
              quantity: 2,
            },
            {
              id: 'fallback-fries',
              name: 'Large Fries',
              price: 5.5,
              image:
                'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=256&q=80',
              quantity: 1,
            },
          ],
    [orderedItems],
  )

  const itemSubtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  )

  const summaryBreakdown = useMemo(() => {
    const normalizedItemsTotal = total > 0 ? Math.min(itemSubtotal, total) : itemSubtotal
    const remaining = Math.max(0, total - normalizedItemsTotal)
    const deliveryFee = remaining > 0 ? Math.min(4, remaining) : 0
    const serviceFee = remaining > deliveryFee ? Math.min(2, remaining - deliveryFee) : 0
    const tax = Math.max(0, total - normalizedItemsTotal - deliveryFee - serviceFee)

    return {
      itemsTotal: normalizedItemsTotal,
      deliveryFee,
      serviceFee,
      tax,
    }
  }, [itemSubtotal, total])

  const clearSimulationTimers = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }

    statusTimersRef.current.forEach(timer => clearTimeout(timer))
    statusTimersRef.current = []
  }, [])

  const animateProgressTo = useCallback(
    (nextMilestone: number) => {
      Animated.timing(progressValue, {
        toValue: nextMilestone,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    },
    [progressValue],
  )

  const fitRouteToMap = useCallback(
    (coordinates: LatLng[]) => {
      if (!mapRef.current || coordinates.length === 0) {
        return
      }

      mapRef.current.fitToCoordinates(
        accessToken && orderId ? coordinates : [courierStartLocation, restaurantLocation, customerLocation, ...coordinates],
        {
          edgePadding: routeFitPadding,
          animated: true,
        },
      )
    },
    [accessToken, orderId, routeFitPadding],
  )

  // Automatically fit map to relevant coordinates (Courier, Restaurant, Customer)
  useEffect(() => {
    if (!accessToken || !orderId) return
    if (!mapRef.current) return

    const upperStatus = orderStatus.toUpperCase()
    const withCourier = ['ASSIGNED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(upperStatus)

    const coordsToFit = [
      withCourier && realCourierLocation ? realCourierLocation : restaurantCoords,
      customerCoords,
      clientGpsCoords,
    ].filter((c): c is { latitude: number; longitude: number } => c !== null && c !== undefined)

    if (coordsToFit.length === 0) return

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordsToFit, {
        edgePadding: routeFitPadding,
        animated: true,
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [accessToken, orderId, orderStatus, realCourierLocation, restaurantCoords, customerCoords, clientGpsCoords, routeFitPadding])

  useEffect(() => {
    screenOpacity.setValue(0)
    screenTranslateY.setValue(18)
    progressValue.setValue(0)

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    return () => {
      clearSimulationTimers()
    }
  }, [clearSimulationTimers, progressValue, screenOpacity, screenTranslateY])

  useEffect(() => {
    Animated.timing(sheetHeight, {
      toValue: isCollapsed ? collapsedHeight : expandedHeight,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [collapsedHeight, expandedHeight, isCollapsed, sheetHeight])

  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(utensilsBounce, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(utensilsBounce, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    bounceLoop.start()

    return () => {
      bounceLoop.stop()
    }
  }, [utensilsBounce])

  useEffect(() => {
    let isMounted = true
    let locationSub: Location.LocationSubscription | null = null

    const setupLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync()
        if (!isMounted) return

        const granted = permission.status === 'granted'
        setHasLocationPermission(granted)

        if (granted && accessToken && orderId) {
          // Track client's real GPS position continuously in real mode
          locationSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 5000 },
            loc => {
              if (isMounted) {
                setClientGpsCoords({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                })
              }
            },
          )
        }
      } catch {
        if (isMounted) {
          setHasLocationPermission(false)
        }
      }
    }

    void setupLocation()

    return () => {
      isMounted = false
      locationSub?.remove()
    }
  }, [accessToken, orderId])

  const lastRouteCalculatedCourierLocationRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const lastRouteCalculatedDestinationRef = useRef<{ latitude: number; longitude: number } | null>(null)

  // Helper distance function
  const getCoordinatesDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Mock-mode route: restaurant → customer (straight/OSRM curve for demo)
  useEffect(() => {
    if (accessToken && orderId) return

    let isMounted = true

    const loadRoute = async () => {
      const response = await calculateRoute(
        { lat: restaurantCoords.latitude, lng: restaurantCoords.longitude },
        { lat: customerCoords.latitude, lng: customerCoords.longitude },
      )

      if (!isMounted) return

      const decodedCoordinates = decodeRoutePolyline(
        response.encodedPolyline,
        { lat: restaurantCoords.latitude, lng: restaurantCoords.longitude }
      )
      const normalizedRoute =
        decodedCoordinates.length >= 2
          ? decodedCoordinates
          : [restaurantCoords, customerCoords]

      setDistanceMeters(response.distanceMeters)
      setDurationSeconds(response.durationSeconds)
      setRouteCoordinates(normalizedRoute)
      fitRouteToMap(normalizedRoute)
    }

    void loadRoute()

    return () => {
      isMounted = false
    }
  }, [accessToken, orderId, fitRouteToMap, restaurantCoords, customerCoords])

  // Real-mode route: courier → client delivery address, recalculates on courier move (only after picked up)
  useEffect(() => {
    if (!accessToken || !orderId) return
    const activeStatuses = [
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERY_CONFIRMATION_PENDING',
    ]
    const status = orderStatus.toUpperCase()
    if (!activeStatuses.includes(status)) {
      setRouteCoordinates([])
      lastRouteCalculatedCourierLocationRef.current = null
      lastRouteCalculatedDestinationRef.current = null
      return
    }

    const origin = realCourierLocation ?? restaurantCoords
    const destination = customerCoords

    if (!origin || !destination) return

    const destinationChanged =
      !lastRouteCalculatedDestinationRef.current ||
      lastRouteCalculatedDestinationRef.current.latitude !== destination.latitude ||
      lastRouteCalculatedDestinationRef.current.longitude !== destination.longitude

    // Throttle calculation: if courier has moved less than 100 meters and destination hasn't changed, do not recalculate route
    if (
      !destinationChanged &&
      lastRouteCalculatedCourierLocationRef.current &&
      getCoordinatesDistance(
        lastRouteCalculatedCourierLocationRef.current.latitude,
        lastRouteCalculatedCourierLocationRef.current.longitude,
        origin.latitude,
        origin.longitude
      ) < 100
    ) {
      return
    }

    let isMounted = true

    const recalculate = async () => {
      try {
        const response = await calculateRoute(
          { lat: origin.latitude, lng: origin.longitude },
          { lat: destination.latitude, lng: destination.longitude },
        )
        if (!isMounted) return

        const decoded = decodeRoutePolyline(
          response.encodedPolyline,
          { lat: origin.latitude, lng: origin.longitude }
        )
        const route = decoded.length >= 2 ? decoded : [origin, destination]

        setDistanceMeters(response.distanceMeters)
        setDurationSeconds(response.durationSeconds)
        setRouteCoordinates(route)
        fitRouteToMap(route)
        lastRouteCalculatedCourierLocationRef.current = { latitude: origin.latitude, longitude: origin.longitude }
        lastRouteCalculatedDestinationRef.current = { latitude: destination.latitude, longitude: destination.longitude }
      } catch {
        // fail silently — keep previous route
      }
    }

    void recalculate()

    return () => {
      isMounted = false
    }
  }, [
    accessToken,
    orderId,
    orderStatus,
    realCourierLocation,
    restaurantCoords,
    customerCoords,
    fitRouteToMap,
  ])

  // 1. Simulation timer effect for mock ordering (without backend credentials)
  useEffect(() => {
    if (accessToken && orderId) {
      return
    }

    if (routeCoordinates.length < 2) {
      return
    }

    clearSimulationTimers()
    courierMarker.setValue({
      latitude: courierStartLocation.latitude,
      longitude: courierStartLocation.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
    setIsDeliveryCompleteVisible(false)
    setSelectedRating(0)
    setOrderStatus('ACCEPTED')
    setDeliveryCode(null)
    setMilestoneIndex(1)
    animateProgressTo(1)

    const routeMidpoint = routeCoordinates[Math.max(1, Math.floor(routeCoordinates.length * 0.55))]

    statusTimersRef.current = [
      setTimeout(() => {
        setOrderStatus('IN_TRANSIT')
        setMilestoneIndex(2)
        animateProgressTo(2)

        if (routeMidpoint) {
          courierMarker
            .timing({
              latitude: routeMidpoint.latitude,
              longitude: routeMidpoint.longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
              duration: 900,
              useNativeDriver: false,
            } as any)
            .start()
        }
      }, 4500),
      setTimeout(() => {
        setOrderStatus('DELIVERY_CONFIRMATION_PENDING')
        setDeliveryCode('482910')
        setMilestoneIndex(3)
        animateProgressTo(3)
      }, 7000),
      setTimeout(() => {
        setOrderStatus('DELIVERED')
        setMilestoneIndex(4)
        setDurationSeconds(0)
        animateProgressTo(4)

        const destination = routeCoordinates[routeCoordinates.length - 1] ?? customerLocation
        courierMarker
          .timing({
            latitude: destination.latitude,
            longitude: destination.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
            duration: 900,
            useNativeDriver: false,
          } as any)
          .start()
      }, 9000),
      setTimeout(() => {
        completionOpacity.setValue(0)
        completionTranslateY.setValue(24)
        completionScale.setValue(0.82)
        setIsDeliveryCompleteVisible(true)

        Animated.parallel([
          Animated.timing(completionOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(completionTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(completionScale, {
            toValue: 1,
            friction: 7,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start()
      }, 10400),
    ]

    return () => {
      clearSimulationTimers()
    }
  }, [
    accessToken,
    orderId,
    routeCoordinates,
    animateProgressTo,
    clearSimulationTimers,
    completionOpacity,
    completionScale,
    completionTranslateY,
    courierMarker,
  ])

  // 2. Real-time polling from the backend (when order credentials are provided)
  useEffect(() => {
    if (!accessToken || !orderId) {
      return
    }

    let isActive = true
    let pollTimer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const orderRes = await getUserOrder(accessToken, orderId)
        if (!isActive) return

        if (!orderRes.ok || !orderRes.data.success || !orderRes.data.data) {
          return
        }

        const latestOrder = orderRes.data.data

        if (latestOrder.pickupAddress?.latitude && latestOrder.pickupAddress?.longitude) {
          const lat = Number(latestOrder.pickupAddress.latitude)
          const lng = Number(latestOrder.pickupAddress.longitude)
          setRestaurantCoords(prev => {
            if (prev.latitude === lat && prev.longitude === lng) return prev
            return { latitude: lat, longitude: lng }
          })
        } else if (latestOrder.pickupAddress?.street) {
          try {
            const q = [latestOrder.pickupAddress.street, latestOrder.pickupAddress.house, latestOrder.pickupAddress.city, 'Kazakhstan'].filter(Boolean).join(', ')
            const res = await googleGeocode(q)
            if (res && isActive) setRestaurantCoords(res)
          } catch {}
        }
        if (latestOrder.deliveryAddress?.latitude && latestOrder.deliveryAddress?.longitude) {
          const lat = Number(latestOrder.deliveryAddress.latitude)
          const lng = Number(latestOrder.deliveryAddress.longitude)
          setCustomerCoords(prev => {
            if (prev.latitude === lat && prev.longitude === lng) return prev
            return { latitude: lat, longitude: lng }
          })
          if (isActive) setHasRealDeliveryCoords(true)
        } else if (latestOrder.deliveryAddress?.street) {
          try {
            const q = [latestOrder.deliveryAddress.street, latestOrder.deliveryAddress.house, latestOrder.deliveryAddress.city, 'Kazakhstan'].filter(Boolean).join(', ')
            const res = await googleGeocode(q)
            if (res && isActive) {
              setCustomerCoords(res)
              setHasRealDeliveryCoords(true)
            }
          } catch {}
        }

        if (latestOrder.deliveryAddress) {
          setDeliveryAddress(latestOrder.deliveryAddress)
          setAddressDetails(prev => {
            const hs = latestOrder.deliveryAddress?.house || ''
            const ent = latestOrder.deliveryAddress?.entrance || ''
            const apt = latestOrder.deliveryAddress?.apartment || ''
            if (!isAddressModalVisibleRef.current && (prev.house !== hs || prev.entrance !== ent || prev.apartment !== apt)) {
              return {
                house: hs,
                entrance: ent,
                apartment: apt,
                doorCode: prev.doorCode
              }
            }
            return prev
          })
        }

        if (latestOrder.deliveryConfirmationCode) {
          const code = latestOrder.deliveryConfirmationCode
          setDeliveryCode(prev => {
            if (prev !== code) {
              // Trigger push banner animation!
              setShowPushNotification(true)
              Animated.spring(pushAnim, {
                toValue: 50,
                useNativeDriver: true,
                tension: 80,
                friction: 8,
              }).start()

              // Auto-dismiss after 9 seconds
              setTimeout(() => {
                Animated.timing(pushAnim, {
                  toValue: -200,
                  duration: 350,
                  useNativeDriver: true,
                }).start(() => setShowPushNotification(false))
              }, 9000)
            }
            return code
          })
        }

        const rawStatus = latestOrder.status || 'NEW'
        setOrderStatus(rawStatus)
        setOrderData(latestOrder)
        const nextTrackingState = mapOrderStatusToTrackingState(rawStatus)
        const nextMilestone = nextTrackingState.currentStep
        setMilestoneIndex(nextMilestone)
        animateProgressTo(nextMilestone)

        const isTerminal = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(rawStatus)
        if (isTerminal) {
          if (rawStatus === 'DELIVERED') {
            setIsDeliveryCompleteVisible(prev => {
              if (!prev) {
                completionOpacity.setValue(0)
                completionTranslateY.setValue(24)
                completionScale.setValue(0.82)
                Animated.parallel([
                  Animated.timing(completionOpacity, {
                    toValue: 1,
                    duration: 260,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                  }),
                  Animated.timing(completionTranslateY, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                  }),
                  Animated.spring(completionScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 90,
                    useNativeDriver: true,
                  }),
                ]).start()
              }
              return true
            })
          }
          if (rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') {
            // Fetch cancellation details from assignment service
            try {
              const assignRes = await getOrderAssignment(accessToken, orderId)
              if (isActive && assignRes.ok && assignRes.data.success && assignRes.data.data) {
                const content = assignRes.data.data.content
                if (content && content.length > 0) {
                  const lastAssignment = content[0]
                  const reason = lastAssignment.cancellationReason || lastAssignment.rejectionReason || ''
                  let who: 'User' | 'Courier' | 'System' = 'User'
                  if (
                    reason.toLowerCase().includes('user') ||
                    reason.toLowerCase().includes('client') ||
                    reason.toLowerCase().includes('customer')
                  ) {
                    who = 'User'
                  } else if (
                    reason.toLowerCase().includes('courier') ||
                    reason.toLowerCase().includes('driver')
                  ) {
                    who = 'Courier'
                  } else if (
                    reason.toLowerCase().includes('timeout') ||
                    reason.toLowerCase().includes('system') ||
                    reason.toLowerCase().includes('no courier available')
                  ) {
                    who = 'System'
                  } else {
                    who = rawStatus === 'REJECTED' ? 'Courier' : 'User'
                  }
                  setCancellationInfo({
                    whoCancelled: who,
                    reason: reason || (rawStatus === 'REJECTED' ? 'Order rejected by partner' : 'User cancelled'),
                  })
                } else {
                  setCancellationInfo({
                    whoCancelled: rawStatus === 'REJECTED' ? 'System' : 'User',
                    reason: rawStatus === 'REJECTED' ? 'Order rejected by partner' : 'User cancelled',
                  })
                }
              } else if (isActive) {
                setCancellationInfo({
                  whoCancelled: rawStatus === 'REJECTED' ? 'System' : 'User',
                  reason: rawStatus === 'REJECTED' ? 'Order rejected by partner' : 'User cancelled',
                })
              }
            } catch (err) {
              console.log('Error fetching cancellation details:', err)
            }
          }
          setDurationSeconds(0)
          setCourierId(null)
          setRealCourierLocation(null)
          return
        }

        const assignRes = await getOrderAssignment(accessToken, orderId)
        if (!isActive) return

        if (assignRes.ok && assignRes.data.success && assignRes.data.data) {
          const content = assignRes.data.data.content
          if (content && content.length > 0) {
            const activeAssign = content[0]
            if (activeAssign.courierId) {
              setCourierId(activeAssign.courierId)

              // Fetch courier details (name, phone)
              const detailsRes = await getCourierDetails(accessToken, activeAssign.courierId)
              if (isActive && detailsRes.ok && detailsRes.data.success && detailsRes.data.data) {
                const courierData = detailsRes.data.data
                setCourierPhone(courierData.phone || null)
                setCourierName(courierData.name ? `${courierData.name}${courierData.surname ? ' ' + courierData.surname : ''}` : null)
              }

              const locRes = await getCourierLocation(accessToken, activeAssign.courierId)
              if (!isActive) return

              if (locRes.ok && locRes.data.success && locRes.data.data) {
                const locData = locRes.data.data
                setRealCourierLocation(prev => {
                  if (prev && prev.latitude === locData.latitude && prev.longitude === locData.longitude) return prev
                  return { latitude: locData.latitude, longitude: locData.longitude }
                })
                setCourierOnline(locData.isOnline)

                if (!courierLocationInitialized.current) {
                  // First fix — jump directly to avoid animating from mock coords
                  courierLocationInitialized.current = true
                  courierMarker.setValue({
                    latitude: locData.latitude,
                    longitude: locData.longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                  })
                } else {
                  courierMarker
                    .timing({
                      latitude: locData.latitude,
                      longitude: locData.longitude,
                      latitudeDelta: 0,
                      longitudeDelta: 0,
                      duration: 1000,
                      useNativeDriver: false,
                    } as any)
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
        console.log('Error in food tracking poll:', err)
      } finally {
        if (isActive) {
          pollTimer = setTimeout(() => void poll(), 5000)
        }
      }
    }

    void poll()

    return () => {
      isActive = false
      clearTimeout(pollTimer)
    }
  }, [
    accessToken,
    orderId,
    animateProgressTo,
    completionOpacity,
    completionScale,
    completionTranslateY,
    courierMarker,
  ])

  const toggleSheet = () => {
    setIsCollapsed(current => !current)
  }

  const currentCourierMessage = useMemo(() => {
    switch (orderStatus.toUpperCase()) {
      case 'ASSIGNED':
        return `Courier ${courierName} is assigned to your parcel.`
      case 'PICKED_UP':
        return `Courier ${courierName} picked up your parcel.`
      case 'IN_TRANSIT':
        return `Courier ${courierName} is on the way to your address.`
      case 'DELIVERY_CONFIRMATION_PENDING':
        return `Courier ${courierName} has arrived. Please share confirmation code.`
      case 'DELIVERED':
        return 'Delivery completed successfully.'
      default:
        return 'Your parcel delivery request is being processed.'
    }
  }, [orderStatus])

  useEffect(() => {
    if (!isDeliveryCompleteVisible) {
      completionOuterPulse.setValue(0)
      completionInnerPulse.setValue(0)
      completionCheckBounce.setValue(0)
      return
    }

    const outerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(completionOuterPulse, {
          toValue: 1,
          duration: 1650,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(completionOuterPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    const innerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(240),
        Animated.timing(completionInnerPulse, {
          toValue: 1,
          duration: 1320,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(completionInnerPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    const checkBounce = Animated.loop(
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(completionCheckBounce, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.back(2.2)),
          useNativeDriver: true,
        }),
        Animated.timing(completionCheckBounce, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
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
      completionOuterPulse.setValue(0)
      completionInnerPulse.setValue(0)
      completionCheckBounce.setValue(0)
    }
  }, [
    completionCheckBounce,
    completionInnerPulse,
    completionOuterPulse,
    isDeliveryCompleteVisible,
  ])

  const openCourierChat = async () => {
    if (!courierPhone) {
      Alert.alert('Unavailable', 'Courier contact information is not available yet. Please wait until a courier is assigned.')
      return
    }

    Alert.alert(
      'Contact Courier',
      `How would you like to contact ${courierName || 'courier'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Chat (SMS)',
          onPress: async () => {
            const smsUrl = `sms:${courierPhone}`
            const canOpen = await Linking.canOpenURL(smsUrl)
            if (canOpen) {
              await Linking.openURL(smsUrl)
            } else {
              Alert.alert('Error', 'Unable to open SMS messaging on this device')
            }
          },
        },
        {
          text: 'Call',
          onPress: async () => {
            const phoneUrl = `tel:${courierPhone}`
            const canOpen = await Linking.canOpenURL(phoneUrl)
            if (canOpen) {
              await Linking.openURL(phoneUrl)
            } else {
              Alert.alert('Error', 'Unable to make phone calls on this device')
            }
          },
        },
      ]
    )
  }

  const handleReorder = () => {
    if (onReorder && orderItems.length > 0) {
      onReorder(orderItems.map(item => ({ id: item.id, quantity: item.quantity })))
    } else {
      onBackPress?.()
    }
  }

  const renderStatusCard = () => {
    if (currentStatusUi.cardVariant === 'delivered') {
      const upperStatus = orderStatus.toUpperCase()
      const isCancelled = ['CANCELLED', 'REJECTED'].includes(upperStatus)
      const iconName = isCancelled ? (upperStatus === 'CANCELLED' ? 'x' : 'slash') : 'check'

      return (
        <View style={[styles.etaCard, styles.deliveredCard, isCancelled && { backgroundColor: '#F2F4F6' }]}>
          <View style={styles.deliveredCopy}>
            <Text allowFontScaling={false} style={[styles.deliveredTitle, isCancelled && { color: '#191C1E' }]}>
              {currentStatusUi.title}
            </Text>
            <Text allowFontScaling={false} style={[styles.deliveredSubtitle, isCancelled && { color: '#58423C' }]}>
              {currentStatusUi.subtitle}
            </Text>
          </View>

          <View style={[styles.deliveredIconCircle, isCancelled && { backgroundColor: currentStatusUi.accentColor }]}>
            <Feather name={iconName} size={isCancelled ? 20 : 28} color="#ffffff" />
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

      <Animated.View
        style={[
          styles.etaIcon,
          {
            transform: [{ translateY: utensilsTranslateY }],
          },
        ]}
      >
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
    if (index < completedStepCount) {
      return styles.progressLabelComplete
    }

    if (index === activeStepIndex && currentStatusUi.highlightActiveLabel) {
      return styles.progressLabelPreparing
    }

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
              <Feather name="home" size={16} color="#ff7a59" />
            </View>

            <View style={styles.addressTitleWrap}>
              <Text allowFontScaling={false} style={styles.addressTitle}>
                {deliveryAddress?.type === 'COMPANY' ? 'Office' : 'Home'}
              </Text>
              <Text allowFontScaling={false} style={styles.addressSubtitle}>
                {deliveryAddress?.street
                  ? `${deliveryAddress.street}${deliveryAddress.house ? `, ${deliveryAddress.house}` : ''}${deliveryAddress.entrance ? `, Entrance ${deliveryAddress.entrance}` : ''}${deliveryAddress.floor ? `, Floor ${deliveryAddress.floor}` : ''}${deliveryAddress.apartment ? `, Apt ${deliveryAddress.apartment}` : ''}${deliveryAddress.city ? `\n${deliveryAddress.city}` : ''}`
                  : '123 Breeze Way, Apt 4B\nNew York, NY 10001'}
              </Text>
            </View>
          </View>

          <View style={styles.addressGrid}>
            {addressFields.map(field => (
              <View key={field.label} style={styles.addressInfoCard}>
                <Text allowFontScaling={false} style={styles.addressInfoLabel}>
                  {field.label}
                </Text>
                <TextInput
                  value={addressDetails[field.key]}
                  onChangeText={value =>
                    setAddressDetails(current => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                  selectionColor="#ff7a59"
                  style={styles.addressInfoInput}
                />
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Instructions for courier', 'Leave at the door if unavailable.')
            }
            style={styles.instructionsRow}
          >
            <View style={styles.instructionsLeft}>
              <MaterialCommunityIcons name="card-text-outline" size={18} color="#aec6ff" />
              <Text allowFontScaling={false} style={styles.instructionsText}>
                Instructions for courier
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#58423c" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSaveAddress}
            style={styles.addressCloseButton}
          >
            <Text allowFontScaling={false} style={styles.addressCloseText}>
              Save Address
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )

  const renderOrderDetailsModal = () => (
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

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Info', 'Detailed receipt will be available soon.')}
            style={styles.orderDetailsHeaderAction}
          >
            <Feather name="info" size={18} color="#191c1e" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.orderDetailsContent,
            {
              paddingTop: insets.top + 80,
              paddingBottom: Math.max(insets.bottom, 16) + 32,
            },
          ]}
        >
          <View style={styles.detailsCard}>
            <View style={styles.detailsRow}>
              <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
                ORDER NUMBER
              </Text>
              <Text allowFontScaling={false} style={styles.detailsOrderNumber}>
                {normalizedOrderNumber}
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.detailsDate}>
              {placedAtText}
            </Text>

            <View style={styles.detailsTotalRow}>
              <Text allowFontScaling={false} style={styles.detailsMutedText}>
                Total
              </Text>
              <Text allowFontScaling={false} style={styles.detailsAccentTotal}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Sender', restaurantName)}
            style={styles.detailsInlineCard}
          >
            <View style={styles.detailsInlineLeft}>
              <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                FROM
              </Text>
              <Text allowFontScaling={false} style={styles.detailsRestaurantName}>
                {restaurantName}
              </Text>
            </View>
            <Text allowFontScaling={false} style={styles.detailsViewText}>
              View
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Sender contact', '+1 (555) 123-4567')}
            style={styles.detailsInlineCard}
          >
            <View style={styles.detailsInlineLeft}>
              <Text allowFontScaling={false} style={styles.detailsSectionCaps}>
                CONTACT
              </Text>
              <Text allowFontScaling={false} style={styles.detailsContactValue}>
                +1 (555) 123-4567
              </Text>
            </View>
            <View style={styles.detailsCallCircle}>
              <Feather name="phone-call" size={18} color="#003275" />
            </View>
          </Pressable>

          <View style={styles.detailsActionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert('Support', 'Support chat is coming soon.')}
              style={styles.detailsAction}
            >
              <View style={styles.detailsActionCircle}>
                <Feather name="help-circle" size={18} color="#58423c" />
              </View>
              <Text allowFontScaling={false} style={styles.detailsActionLabel}>
                Support
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOrderDetailsVisible(false)}
              style={styles.detailsAction}
            >
              <View style={styles.detailsActionCircle}>
                <Feather name="map-pin" size={18} color="#58423c" />
              </View>
              <Text allowFontScaling={false} style={styles.detailsActionLabel}>
                On Map
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openCourierChat}
              style={styles.detailsAction}
            >
              <View style={styles.detailsActionCircle}>
                <MaterialCommunityIcons name="bike-fast" size={20} color="#58423c" />
              </View>
              <Text allowFontScaling={false} style={styles.detailsActionLabel}>
                Courier
              </Text>
            </Pressable>
          </View>

          <View style={styles.detailsCard}>
            <Text allowFontScaling={false} style={styles.detailsBlockTitle}>
              Items
            </Text>

            <View style={styles.detailsItemsList}>
              {orderItems.map(item => (
                <View key={item.id} style={styles.detailsItemRow}>
                  <Image source={{ uri: item.image }} resizeMode="cover" style={styles.detailsItemImage} />

                  <View style={styles.detailsItemCopy}>
                    <Text allowFontScaling={false} style={styles.detailsItemName}>
                      {item.name}
                    </Text>
                    <Text allowFontScaling={false} style={styles.detailsItemQty}>
                      Qty: {item.quantity}
                    </Text>
                  </View>

                  <Text allowFontScaling={false} style={styles.detailsItemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailsSummaryRow}>
              <Text allowFontScaling={false} style={styles.detailsMutedText}>
                Items Total
              </Text>
              <Text allowFontScaling={false} style={styles.detailsSummaryValue}>
                ${summaryBreakdown.itemsTotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailsSummaryRow}>
              <Text allowFontScaling={false} style={styles.detailsMutedText}>
                Delivery Fee
              </Text>
              <Text allowFontScaling={false} style={styles.detailsSummaryValue}>
                ${summaryBreakdown.deliveryFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailsSummaryRow}>
              <Text allowFontScaling={false} style={styles.detailsMutedText}>
                Service Fee
              </Text>
              <Text allowFontScaling={false} style={styles.detailsSummaryValue}>
                ${summaryBreakdown.serviceFee.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.detailsSummaryRow, styles.detailsSummaryDivider]}>
              <Text allowFontScaling={false} style={styles.detailsMutedText}>
                Tax
              </Text>
              <Text allowFontScaling={false} style={styles.detailsSummaryValue}>
                ${summaryBreakdown.tax.toFixed(2)}
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.detailsDeliveredTo}>
              Delivered to: {deliveryAddress
                ? `${deliveryAddress.street || ''}${deliveryAddress.house ? `, ${deliveryAddress.house}` : ''}${deliveryAddress.entrance ? `, Entrance ${deliveryAddress.entrance}` : ''}${deliveryAddress.floor ? `, Floor ${deliveryAddress.floor}` : ''}${deliveryAddress.apartment ? `, Apt ${deliveryAddress.apartment}` : ''}`
                : '123 Main St, Apt 4B'}
            </Text>
          </View>

          <View style={styles.detailsPaidCard}>
            <Text allowFontScaling={false} style={styles.detailsMutedCaps}>
              TOTAL PAID
            </Text>
            <Text allowFontScaling={false} style={styles.detailsPaidValue}>
              ${total.toFixed(2)}
            </Text>

            <View style={styles.detailsPaidMethodRow}>
              <MaterialCommunityIcons name="credit-card-outline" size={16} color="#58423c" />
              <Text allowFontScaling={false} style={styles.detailsPaidMethodText}>
                Visa **** 1234
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
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
            {
              opacity: completionOpacity,
              transform: [{ translateY: completionTranslateY }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.completionHeroWrap,
              {
                transform: [{ scale: completionScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.completionGlowPrimary,
                {
                  opacity: completionOuterOpacity,
                  transform: [{ scale: completionOuterScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.completionGlowSecondary,
                {
                  opacity: completionInnerOpacity,
                  transform: [{ scale: completionInnerScale }],
                },
              ]}
            />
            <View style={styles.completionHeroCircle}>
              <Animated.View style={{ transform: [{ scale: completionCheckScale }] }}>
                <Feather name="check" size={54} color="#ffffff" />
              </Animated.View>
            </View>
          </Animated.View>

          <View style={styles.completionTextBlock}>
            <Text allowFontScaling={false} style={styles.completionTitle}>
              Order delivered
            </Text>
            <Text allowFontScaling={false} style={styles.completionSubtitle}>
              Your order has been delivered.{' '}Thanks for{'\n'}choosing us!
            </Text>
          </View>

          <View style={styles.ratingCard}>
            <Text allowFontScaling={false} style={styles.ratingCardLabel}>
              RATE YOUR EXPERIENCE
            </Text>

            <View style={styles.ratingStarsRow}>
              {Array.from({ length: 5 }, (_, index) => {
                const ratingValue = index + 1
                const isFilled = ratingValue <= selectedRating

                return (
                  <Pressable
                    key={`rating-${ratingValue}`}
                    accessibilityRole="button"
                    onPress={() => setSelectedRating(ratingValue)}
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
                  `Thanks for rating this order${selectedRating > 0 ? ` ${selectedRating}/5` : ''}.`,
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
              <MaterialCommunityIcons name="reload" size={18} color="#58423c" />
              <Text allowFontScaling={false} style={styles.completionSecondaryButtonText}>
                Reorder Items
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )

  return (
    <View style={styles.screen}>
      {showPushNotification && (
        <Animated.View style={[styles.pushBanner, { transform: [{ translateY: pushAnim }] }]}>
          <View style={styles.pushHeader}>
            <View style={styles.pushIconContainer}>
              <Feather name="shield" size={12} color="#fff" />
            </View>
            <Text style={styles.pushAppName}>SwiftDeliver</Text>
            <Text style={styles.pushTime}>now</Text>
          </View>
          <Text style={styles.pushTitle}>Код подтверждения доставки</Text>
          <Text style={styles.pushBody}>
            Ваш секретный код доставки: <Text style={styles.pushCodeHighlight}>{deliveryCode}</Text>. Пожалуйста, сообщите его курьеру для подтверждения заказа.
          </Text>
        </Animated.View>
      )}

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onPress={() => {
          if (!isCollapsed) {
            setIsCollapsed(true)
          }
        }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsCompass={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {showRoute && routeCoordinates.length > 1 && (
          <>
            <MapPolyline coordinates={routeCoordinates} strokeColor="#ffffff" strokeWidth={8} />
            <MapPolyline coordinates={routeCoordinates} strokeColor="#5f98ff" strokeWidth={4} />
          </>
        )}

        {showPickupMarker && (
          <Marker coordinate={restaurantCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.restaurantMarkerHalo} />
            <View style={styles.restaurantMarker} />
          </Marker>
        )}

        {/* Delivery address destination pin (separate from client GPS) */}
        {showDeliveryMarker && (
          <Marker coordinate={customerCoords} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.destinationPin}>
              <View style={styles.destinationPinTip} />
            </View>
          </Marker>
        )}

        {/* Client's real GPS position marker */}
        {showClientMarker && clientGpsCoords && (
          <Marker coordinate={clientGpsCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.clientGpsHalo}>
              <View style={styles.clientGpsMarker} />
            </View>
          </Marker>
        )}

        {showCourierMarker && (
          <Marker.Animated coordinate={animatedCourierCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.courierMarker}>
              <View style={styles.courierDot} />
            </View>
          </Marker.Animated>
        )}
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
          onPress={() => Alert.alert('Support', 'Live support is coming soon.')}
          style={styles.headerAction}
        >
          <Feather name="help-circle" size={18} color="#a7391e" />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.sheetShell,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
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
                  <Text allowFontScaling={false} style={styles.title}>
                    {currentStatusUi.title}
                  </Text>
                  <Text allowFontScaling={false} style={styles.subtitle}>
                    {currentStatusUi.subtitle}
                  </Text>
                </View>
              ) : null}

              {renderStatusCard()}

              {orderStatus.toUpperCase() === 'CANCELLED' ? (
                <>
                  <View style={styles.cancellationCard}>
                    <Text allowFontScaling={false} style={styles.cancellationHeader}>CANCELLATION DETAILS</Text>
                    
                    <View style={styles.cancellationField}>
                      <Text allowFontScaling={false} style={styles.cancellationLabel}>Who cancelled:</Text>
                      <Text allowFontScaling={false} style={styles.cancellationValue}>
                        {cancellationInfo?.whoCancelled || 'Courier'}
                      </Text>
                    </View>

                    <View style={styles.cancellationField}>
                      <Text allowFontScaling={false} style={styles.cancellationLabel}>Reason:</Text>
                      <Text allowFontScaling={false} style={styles.cancellationValue}>
                        {cancellationInfo?.reason || 'Client requested cancellation'}
                      </Text>
                    </View>

                    <View style={styles.cancellationSeparator} />

                    <Text allowFontScaling={false} style={styles.cancellationSubHeader}>Order Snapshot</Text>

                    <View style={styles.snapshotRow}>
                      <Feather name="map-pin" size={14} color="#862208" style={styles.snapshotIcon} />
                      <View style={styles.snapshotTextContainer}>
                        <Text allowFontScaling={false} style={styles.snapshotLabel}>Pickup</Text>
                        <Text allowFontScaling={false} style={styles.snapshotValue}>{restaurantName}</Text>
                      </View>
                    </View>

                    <View style={styles.snapshotRow}>
                      <Feather name="navigation" size={14} color="#004397" style={styles.snapshotIcon} />
                      <View style={styles.snapshotTextContainer}>
                        <Text allowFontScaling={false} style={styles.snapshotLabel}>Dropoff</Text>
                        <Text allowFontScaling={false} style={styles.snapshotValue}>
                          {deliveryAddress
                            ? `${deliveryAddress.street || ''}${deliveryAddress.house ? `, ${deliveryAddress.house}` : ''}${deliveryAddress.entrance ? `, Entrance ${deliveryAddress.entrance}` : ''}${deliveryAddress.floor ? `, Floor ${deliveryAddress.floor}` : ''}${deliveryAddress.apartment ? `, Apt ${deliveryAddress.apartment}` : ''}`
                            : 'Astana, Uly Dala Ave, 8'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.snapshotGrid}>
                      <View style={styles.snapshotGridItem}>
                        <Text allowFontScaling={false} style={styles.snapshotGridLabel}>Parcel Size</Text>
                        <Text allowFontScaling={false} style={styles.snapshotGridValue}>
                          {orderData?.parcelSize ? orderData.parcelSize.charAt(0) + orderData.parcelSize.slice(1).toLowerCase() : 'Small'}
                        </Text>
                      </View>
                      <View style={styles.snapshotGridItem}>
                        <Text allowFontScaling={false} style={styles.snapshotGridLabel}>Service Type</Text>
                        <Text allowFontScaling={false} style={styles.snapshotGridValue}>
                          {orderData?.serviceType ? orderData.serviceType.charAt(0) + orderData.serviceType.slice(1).toLowerCase() : 'Standard'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.financialCard}>
                    <Text allowFontScaling={false} style={styles.financialHeader}>FINANCIAL SUMMARY</Text>
                    
                    <View style={styles.financialRow}>
                      <View style={styles.financialStatusWrap}>
                        <Feather 
                          name={total > 0 ? "refresh-ccw" : "info"} 
                          size={16} 
                          color={total > 0 ? "#2C4E2E" : "#6B7280"} 
                          style={styles.financialStatusIcon}
                        />
                        <Text allowFontScaling={false} style={styles.financialStatusText}>
                          {total > 0 
                            ? `Refund of ₸${Math.round(total * 450).toLocaleString()} initiated`
                            : "You were not charged"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.financialRow}>
                      <Text allowFontScaling={false} style={styles.financialFeeLabel}>Delivery Fee</Text>
                      <Text allowFontScaling={false} style={styles.financialFeeStruck}>
                        ₸1,200
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
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
                                <Feather
                                  name="package"
                                  size={12}
                                  color="#ffffff"
                                />
                              ) : null}
                              {isActive && step.key === 'onWay' ? (
                                <MaterialCommunityIcons
                                  name="bike-fast"
                                  size={14}
                                  color="#ffffff"
                                />
                              ) : null}
                              {isActive && step.key === 'arrived' ? (
                                <Feather
                                  name="map-pin"
                                  size={12}
                                  color="#ffffff"
                                />
                              ) : null}
                              {isActive && step.key === 'delivered' ? (
                                <Feather
                                  name="check"
                                  size={12}
                                  color="#ffffff"
                                />
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
                              isActive && currentStatusUi.highlightActiveLabel && styles.progressLabelActive,
                              isActive &&
                                currentStatusUi.highlightActiveLabel && { color: currentStatusUi.accentColor },
                            ]}
                          >
                            {step.label}
                          </Text>
                        )
                      })}
                    </View>
                  </View>

                  {trackingState.showConfirmationCode ? (
                    deliveryCode ? (
                      <View style={styles.codeCard}>
                        <Text style={styles.codeLabel}>Delivery confirmation code</Text>
                        <Text style={styles.codeValue}>{deliveryCode}</Text>
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
                    <Pressable
                      accessibilityRole="button"
                      onPress={openCourierChat}
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
                      onPress={openAddressModal}
                      style={styles.quickAction}
                    >
                      <View style={[styles.quickIconCircle, styles.quickIconAddress]}>
                        <Feather name="home" size={20} color="#004397" />
                      </View>
                      <Text allowFontScaling={false} style={styles.quickActionLabel}>
                        Address{'\n'}details
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setIsOrderDetailsVisible(true)}
                      style={styles.quickAction}
                    >
                      <View style={[styles.quickIconCircle, styles.quickIconOrder]}>
                        <MaterialCommunityIcons
                          name="clipboard-text-outline"
                          size={20}
                          color="#58423c"
                        />
                      </View>
                      <Text allowFontScaling={false} style={styles.quickActionLabel}>
                        Order{'\n'}details
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}



              <View style={styles.bottomActions}>
                {orderStatus.toUpperCase() === 'CANCELLED' ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleReorder}
                      style={[styles.bottomButton, styles.primaryButton, { marginLeft: 0, marginRight: 8 }]}
                    >
                      <Text allowFontScaling={false} style={styles.primaryButtonText}>
                        Reorder
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => Alert.alert('Support', 'Support chat is coming soon.')}
                      style={[styles.bottomButton, styles.secondaryButton, { marginLeft: 8, marginRight: 0 }]}
                    >
                      <Text allowFontScaling={false} style={styles.secondaryButtonText}>
                        Support
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isCanceling}
                      onPress={handleCancelOrder}
                      style={[styles.bottomButton, styles.secondaryButton, isCanceling && { opacity: 0.5 }]}
                    >
                      <Text allowFontScaling={false} style={styles.secondaryButtonText}>
                        {isCanceling ? 'Canceling...' : 'Cancel order'}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => Alert.alert('Support', 'Support chat is coming soon.')}
                      style={[styles.bottomButton, styles.primaryButton]}
                    >
                      <Text allowFontScaling={false} style={styles.primaryButtonText}>
                        Support
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>

      {renderAddressModal()}
      {renderOrderDetailsModal()}
      {renderDeliveryCompleteModal()}
    </View>
  )
}

function interpolateLine(start: LatLng, finish: LatLng, segments: number): LatLng[] {
  const coordinates: LatLng[] = [start]

  for (let step = 1; step <= segments; step += 1) {
    const progress = step / segments
    coordinates.push({
      latitude: start.latitude + (finish.latitude - start.latitude) * progress,
      longitude: start.longitude + (finish.longitude - start.longitude) * progress,
    })
  }

  return coordinates
}

function sampleRoute(route: RoutePoint[], targetCount: number): LatLng[] {
  if (route.length <= targetCount) {
    return route
  }

  const sampled: LatLng[] = [route[0]]
  const step = (route.length - 1) / (targetCount - 1)

  for (let index = 1; index < targetCount - 1; index += 1) {
    sampled.push(route[Math.round(index * step)])
  }

  sampled.push(route[route.length - 1])
  return sampled
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  codeCard: {
    borderRadius: 20,
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
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
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 57, 30, 0.3)',
    alignItems: 'center',
  },
  codeExpiredLabel: {
    color: '#A7391E',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeExpiredHint: {
    color: '#A7391E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  pushBanner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(25, 28, 38, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  pushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pushIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#ff7a59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pushAppName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  pushTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  pushTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  pushBody: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  pushCodeHighlight: {
    color: '#ff7a59',
    fontWeight: '800',
    fontSize: 15,
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
  customerMarkerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191c1e',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  customerMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  // Delivery address destination pin (teardrip/pin shape)
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
  // Client's real GPS position marker (pulsing blue)
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
    shadowColor: '#1e5bba',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
    shadowColor: '#1e5bba',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  courierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  restaurantMarkerHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(167, 57, 30, 0.28)',
  },
  restaurantMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a7391e',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
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
  addressInfoInput: {
    padding: 0,
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  instructionsRow: {
    marginTop: 24,
    padding: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
  },
  instructionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionsText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
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
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
  },
  orderDetailsHeaderAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetailsHeaderTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
  },
  orderDetailsContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  detailsCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsMutedCaps: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    fontWeight: '400',
  },
  detailsOrderNumber: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  detailsDate: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsMutedText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsAccentTotal: {
    color: '#ff7a59',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  detailsInlineCard: {
    padding: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  detailsInlineLeft: {
    flex: 1,
    gap: 4,
  },
  detailsSectionCaps: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '400',
  },
  detailsRestaurantName: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  detailsViewText: {
    color: '#a7391e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  detailsContactValue: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  detailsCallCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8e2ff',
    shadowColor: '#1e5bba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  detailsActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  detailsActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e3e5',
  },
  detailsActionLabel: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  detailsBlockTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  detailsItemsList: {
    gap: 16,
  },
  detailsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailsItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e6e8ea',
  },
  detailsItemCopy: {
    flex: 1,
    gap: 2,
  },
  detailsItemName: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  detailsItemQty: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsItemPrice: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  detailsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsSummaryDivider: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f2f4f6',
  },
  detailsSummaryValue: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsDeliveredTo: {
    opacity: 0.7,
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  detailsPaidCard: {
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  detailsPaidValue: {
    color: '#191c1e',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
  },
  detailsPaidMethodRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsPaidMethodText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  chatScreen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  chatHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatHeaderBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCourierMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatAvatarWrap: {
    width: 40,
    height: 40,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatAvatarStatus: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#446744',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatCourierTextWrap: {
    gap: 2,
  },
  chatCourierName: {
    color: '#191c1e',
    fontSize: 20,
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
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  chatContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  chatDateWrap: {
    alignItems: 'center',
    paddingTop: 8,
  },
  chatDateChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f2f4f6',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  chatDateText: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  chatIncomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '92%',
  },
  chatIncomingRowStacked: {
    marginTop: -8,
  },
  chatBubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 22,
  },
  chatBubbleAvatarSpacer: {
    width: 24,
  },
  chatIncomingGroup: {
    gap: 4,
    maxWidth: '88%',
  },
  chatIncomingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(223, 192, 184, 0.10)',
  },
  chatIncomingBubbleWithTail: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 2,
  },
  chatIncomingBubbleStacked: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  chatIncomingText: {
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  chatMetaText: {
    color: '#58423c',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '400',
  },
  chatOutgoingWrap: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    gap: 4,
  },
  chatOutgoingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 2,
    backgroundColor: '#d75d37',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 3,
  },
  chatOutgoingText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  chatOutgoingMetaRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  chatComposerShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    gap: 12,
  },
  chatQuickReplies: {
    gap: 8,
    paddingRight: 12,
  },
  chatReplyChip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
  },
  chatReplyChipPrimary: {
    backgroundColor: 'rgba(255, 218, 210, 0.40)',
    borderWidth: 1,
    borderColor: '#ffdAD2',
  },
  chatReplyChipSecondary: {
    backgroundColor: 'rgba(216, 226, 255, 0.40)',
    borderWidth: 1,
    borderColor: '#d8e2ff',
  },
  chatReplyText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  chatReplyTextPrimary: {
    color: '#701500',
  },
  chatReplyTextSecondary: {
    color: '#003275',
  },
  chatComposerRow: {
    padding: 8,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f2f4f6',
  },
  chatPlusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingVertical: 10,
    color: '#191c1e',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#ff7a59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 3,
  },
  completionScreen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionHeroWrap: {
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionGlowPrimary: {
    position: 'absolute',
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: 'rgba(197, 237, 193, 0.42)',
  },
  completionGlowSecondary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 218, 210, 0.28)',
  },
  completionHeroCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#446744',
    shadowColor: '#446744',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  completionTextBlock: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  completionTitle: {
    color: '#191c1e',
    fontSize: 36,
    lineHeight: 45,
    fontWeight: '800',
    textAlign: 'center',
  },
  completionSubtitle: {
    color: '#58423c',
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400',
    textAlign: 'center',
  },
  ratingCard: {
    width: '100%',
    marginTop: 48,
    padding: 32,
    borderRadius: 48,
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  ratingCardLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  ratingStarsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStarButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  completionActions: {
    width: '100%',
    marginTop: 48,
    gap: 16,
  },
  completionPrimaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  completionPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.45,
    fontWeight: '700',
  },
  completionSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#dfc0b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f7f9fb',
  },
  completionSecondaryButtonText: {
    color: '#58423c',
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.45,
    fontWeight: '700',
  },
  otpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginHorizontal: 4,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#fff5f3',
    borderWidth: 1.5,
    borderColor: '#ffdad2',
  },
  otpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe6e1',
    flexShrink: 0,
  },
  otpCopy: {
    flex: 1,
    gap: 4,
  },
  otpLabel: {
    color: '#a7391e',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  otpCode: {
    color: '#191c1e',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 6,
  },
  otpHint: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  cancellationCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancellationHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  cancellationField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancellationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  cancellationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  cancellationSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  cancellationSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 12,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  snapshotIcon: {
    marginRight: 12,
    width: 16,
    textAlign: 'center',
  },
  snapshotTextContainer: {
    flex: 1,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
  },
  snapshotValue: {
    fontSize: 14,
    color: '#2D3748',
    marginTop: 2,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  snapshotGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  snapshotGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
  },
  snapshotGridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginTop: 2,
  },
  financialCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  financialHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  financialStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financialStatusIcon: {
    marginRight: 8,
  },
  financialStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  financialFeeLabel: {
    fontSize: 14,
    color: '#4A5568',
  },
  financialFeeStruck: {
    fontSize: 14,
    color: '#A0AEC0',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
})
