import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  Image,
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
import MapView, {
  AnimatedRegion,
  LatLng,
  Marker,
  Polyline as MapPolyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import * as Location from 'expo-location'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { calculateRoute, decodeRoutePolyline, RoutePoint } from '../../data/routesApi'
import { getUserOrder } from '../../data/ordersApi'
import { getOrderAssignment, getCourierLocation, autoAssignOrder } from '../../data/logisticsApi'

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
}

type DetailedStatus =
  | 'Order received'
  | 'Courier assigned'
  | 'Going to restaurant'
  | 'Picked up'
  | 'On the way'
  | 'Delivered'

type EtaMode = 'preparing' | 'liveRoute' | 'delivered'
const courierName = 'Aman'

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
  { key: 'pickedUp', label: 'PICKED\nUP' },
  { key: 'delivered', label: 'DELIVERED' },
] as const

const addressFields = [
  { key: 'entrance', label: 'ENTRANCE' },
  { key: 'floor', label: 'FLOOR' },
  { key: 'apartment', label: 'APARTMENT' },
  { key: 'doorCode', label: 'DOOR CODE' },
] as const

const courierQuickReplies = ['I’m coming', 'Leave at door', 'Wait 5 min'] as const
const courierAvatarUri =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'

type ChatMessage = {
  id: string
  text: string
  time: string
  sender: 'courier' | 'user'
  showAvatar?: boolean
}

const initialCourierMessages: ChatMessage[] = [
  {
    id: 'courier-1',
    text: "Hi! I'm near your building, but I can't find the entrance.",
    time: '12:42 PM',
    sender: 'courier',
    showAvatar: true,
  },
  {
    id: 'courier-2',
    text: 'Please come outside if possible.',
    time: '12:43 PM',
    sender: 'courier',
  },
  {
    id: 'user-1',
    text: "No problem, I'm coming down now!",
    time: '12:44 PM',
    sender: 'user',
  },
] as const

const statusPresentation: Record<
  DetailedStatus,
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
  'Order received': {
    title: 'Confirmed your order',
    subtitle: 'The kitchen is recieved your order',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  'Courier assigned': {
    title: 'Confirmed your order',
    subtitle: 'The kitchen is recieved your order',
    accentColor: '#a7391e',
    milestoneIndex: 1,
    etaStatusText: 'Preparing your order',
    etaMode: 'preparing',
    highlightActiveLabel: true,
    cardVariant: 'eta',
  },
  'Going to restaurant': {
    title: `Courier ${courierName} is on the way`,
    subtitle: 'Courier assigned',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  'Picked up': {
    title: `Courier ${courierName} is on the way`,
    subtitle: 'Courier assigned',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  'On the way': {
    title: `Courier ${courierName} is on the way`,
    subtitle: 'Courier assigned',
    accentColor: '#a7391e',
    milestoneIndex: 2,
    etaStatusText: 'On the way',
    etaMode: 'liveRoute',
    highlightActiveLabel: false,
    cardVariant: 'eta',
  },
  Delivered: {
    title: 'Order delivered',
    subtitle: 'Enjoy your meal! Please take a moment to rate your experience.',
    accentColor: '#446744',
    milestoneIndex: 3,
    etaStatusText: 'Delivered successfully',
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
}: OrderStatusScreenProps) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([
    courierStartLocation,
    restaurantLocation,
    customerLocation,
  ])
  const [distanceMeters, setDistanceMeters] = useState(4200)
  const [durationSeconds, setDurationSeconds] = useState(50 * 60)
  const [detailedStatus, setDetailedStatus] = useState<DetailedStatus>('Order received')
  const [courierId, setCourierId] = useState<string | null>(null)
  const [realCourierLocation, setRealCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [courierOnline, setCourierOnline] = useState<boolean>(false)
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null)
  const [showPushNotification, setShowPushNotification] = useState<boolean>(false)
  const pushAnim = useRef(new Animated.Value(-160)).current
  const [restaurantCoords, setRestaurantCoords] = useState(restaurantLocation)
  const [customerCoords, setCustomerCoords] = useState(customerLocation)
  const [milestoneIndex, setMilestoneIndex] = useState(1)
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false)
  const [isOrderDetailsVisible, setIsOrderDetailsVisible] = useState(false)
  const [isCourierChatVisible, setIsCourierChatVisible] = useState(false)
  const [isDeliveryCompleteVisible, setIsDeliveryCompleteVisible] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([...initialCourierMessages])
  const [selectedRating, setSelectedRating] = useState(0)
  const [addressDetails, setAddressDetails] = useState({
    entrance: 'Main',
    floor: '4',
    apartment: '4B',
    doorCode: '1234',
  })

  const mapRef = useRef<MapView | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
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

  const currentStatusUi = statusPresentation[detailedStatus]
  const animatedCourierCoordinate = courierMarker as unknown as LatLng
  const completedStepCount = useMemo(() => {
    switch (detailedStatus) {
      case 'Picked up':
        return 3
      case 'Delivered':
        return 4
      case 'Going to restaurant':
      case 'On the way':
        return 2
      default:
        return 1
    }
  }, [detailedStatus])

  const activeStepIndex = useMemo(() => {
    switch (detailedStatus) {
      case 'Order received':
      case 'Courier assigned':
        return 1
      case 'Going to restaurant':
      case 'On the way':
        return 2
      default:
        return -1
    }
  }, [detailedStatus])

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['5%', '31%', '65%', '100%'],
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

    if (
      detailedStatus === 'Going to restaurant' ||
      detailedStatus === 'Picked up' ||
      detailedStatus === 'On the way'
    ) {
      return '10-15'
    }

    const minutes = Math.max(5, Math.ceil(durationSeconds / 60))
    const lower = Math.max(0, minutes - 5)
    const upper = minutes + 5
    return `${lower}-${upper}`
  }, [currentStatusUi.etaMode, detailedStatus, durationSeconds])

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
        [courierStartLocation, restaurantLocation, customerLocation, ...coordinates],
        {
          edgePadding: routeFitPadding,
          animated: true,
        },
      )
    },
    [routeFitPadding],
  )

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

    const setupLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync()
        if (!isMounted) {
          return
        }

        setHasLocationPermission(permission.status === 'granted')
      } catch {
        if (isMounted) {
          setHasLocationPermission(false)
        }
      }
    }

    void setupLocation()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadRoute = async () => {
      const response = await calculateRoute(
        { lat: restaurantCoords.latitude, lng: restaurantCoords.longitude },
        { lat: customerCoords.latitude, lng: customerCoords.longitude },
      )

      if (!isMounted) {
        return
      }

      const decodedCoordinates = decodeRoutePolyline(response.encodedPolyline)
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
  }, [fitRouteToMap, restaurantCoords, customerCoords])

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
    setDetailedStatus('Order received')
    setMilestoneIndex(1)
    animateProgressTo(1)

    const routeMidpoint = routeCoordinates[Math.max(1, Math.floor(routeCoordinates.length * 0.55))]

    statusTimersRef.current = [
      setTimeout(() => {
        setDetailedStatus('On the way')
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
        setDetailedStatus('Picked up')
        setMilestoneIndex(2)
        animateProgressTo(2)
      }, 7000),
      setTimeout(() => {
        setDetailedStatus('Delivered')
        setMilestoneIndex(3)
        setDurationSeconds(0)
        animateProgressTo(3)

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
    let pollTimer: NodeJS.Timeout

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
        }
        if (latestOrder.deliveryAddress?.latitude && latestOrder.deliveryAddress?.longitude) {
          const lat = Number(latestOrder.deliveryAddress.latitude)
          const lng = Number(latestOrder.deliveryAddress.longitude)
          setCustomerCoords(prev => {
            if (prev.latitude === lat && prev.longitude === lng) return prev
            return { latitude: lat, longitude: lng }
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
        if (rawStatus === 'NEW') {
          void autoAssignOrder(accessToken, orderId)
        }
        let mappedStatus: DetailedStatus = 'Order received'
        let nextMilestone = 1

        if (['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(rawStatus)) {
          mappedStatus = 'Order received'
          nextMilestone = 1
        } else if (rawStatus === 'ASSIGNED') {
          mappedStatus = 'Courier assigned'
          nextMilestone = 2
        } else if (rawStatus === 'PICKED_UP') {
          mappedStatus = 'Picked up'
          nextMilestone = 2
        } else if (['IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(rawStatus)) {
          mappedStatus = 'On the way'
          nextMilestone = 2
        } else if (rawStatus === 'DELIVERED') {
          mappedStatus = 'Delivered'
          nextMilestone = 3
        }

        setDetailedStatus(mappedStatus)
        setMilestoneIndex(nextMilestone)
        animateProgressTo(nextMilestone)

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

              const locRes = await getCourierLocation(accessToken, activeAssign.courierId)
              if (!isActive) return

              if (locRes.ok && locRes.data.success && locRes.data.data) {
                const locData = locRes.data.data
                setRealCourierLocation(prev => {
                  if (prev && prev.latitude === locData.latitude && prev.longitude === locData.longitude) return prev
                  return {
                    latitude: locData.latitude,
                    longitude: locData.longitude,
                  }
                })
                setCourierOnline(locData.isOnline)

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
    switch (detailedStatus) {
      case 'Courier assigned':
        return `${courierName} is assigned to your order.`
      case 'Going to restaurant':
        return `${courierName} is on the way with your order.`
      case 'Picked up':
        return `${courierName} picked up your order.`
      case 'On the way':
        return `${courierName} is on the way to your address.`
      case 'Delivered':
        return 'Delivery completed successfully.'
      default:
        return 'The restaurant has received your order.'
    }
  }, [detailedStatus])

  const scrollChatToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true })
    })
  }, [])

  useEffect(() => {
    if (isCourierChatVisible) {
      scrollChatToBottom()
    }
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

  const openCourierChat = () => {
    setIsCourierChatVisible(true)
  }

  const pushUserChatMessage = useCallback(
    (messageText: string) => {
      const normalized = messageText.trim()

      if (!normalized) {
        return
      }

      const time = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

      setChatMessages(current => [
        ...current,
        {
          id: `user-${Date.now()}`,
          text: normalized,
          time,
          sender: 'user',
        },
      ])
      setChatDraft('')
    },
    [],
  )

  const renderStatusCard = () => {
    if (currentStatusUi.cardVariant === 'delivered') {
      return (
        <View style={[styles.etaCard, styles.deliveredCard]}>
          <View style={styles.deliveredCopy}>
            <Text allowFontScaling={false} style={styles.deliveredTitle}>
              Order delivered
            </Text>
            <Text allowFontScaling={false} style={styles.deliveredSubtitle}>
              Enjoy your meal! Please take a moment to rate your experience.
            </Text>
          </View>

          <View style={styles.deliveredIconCircle}>
            <Feather name="check" size={28} color="#ffffff" />
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
          name={currentStatusUi.etaMode === 'preparing' ? 'silverware-fork-knife' : 'bike-fast'}
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
                Home
              </Text>
              <Text allowFontScaling={false} style={styles.addressSubtitle}>
                123 Breeze Way, Apt 4B{'\n'}New York, NY 10001
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
            onPress={() => Alert.alert('Restaurant', restaurantName)}
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
            onPress={() => Alert.alert('Restaurant contact', '+1 (555) 123-4567')}
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
              onPress={() => {
                setIsOrderDetailsVisible(false)
                openCourierChat()
              }}
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
              Delivered to: 123 Main St, Apt 4B
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
                <Image source={{ uri: courierAvatarUri }} resizeMode="cover" style={styles.chatAvatar} />
                <View style={styles.chatAvatarStatus} />
              </View>

              <View style={styles.chatCourierTextWrap}>
                <Text allowFontScaling={false} style={styles.chatCourierName}>
                  Courier Aman
                </Text>
                <Text allowFontScaling={false} style={styles.chatCourierStatus}>
                  Online
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Call courier', '+1 (555) 123-4567')}
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
            {
              paddingTop: insets.top + 84,
              paddingBottom: 188 + Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.chatDateWrap}>
            <View style={styles.chatDateChip}>
              <Text allowFontScaling={false} style={styles.chatDateText}>
                Today, 12:42 PM
              </Text>
            </View>
          </View>

          {chatMessages.map((message, index) => {
            const isCourier = message.sender === 'courier'
            const showAvatar = Boolean(isCourier && message.showAvatar)
            const previousMessage = index > 0 ? chatMessages[index - 1] : null
            const isStackedCourier =
              isCourier && previousMessage?.sender === 'courier' && !message.showAvatar

            if (isCourier) {
              return (
                <View
                  key={message.id}
                  style={[
                    styles.chatIncomingRow,
                    isStackedCourier && styles.chatIncomingRowStacked,
                  ]}
                >
                  {showAvatar ? (
                    <Image source={{ uri: courierAvatarUri }} resizeMode="cover" style={styles.chatBubbleAvatar} />
                  ) : (
                    <View style={styles.chatBubbleAvatarSpacer} />
                  )}

                  <View style={styles.chatIncomingGroup}>
                    <View
                      style={[
                        styles.chatIncomingBubble,
                        showAvatar ? styles.chatIncomingBubbleWithTail : styles.chatIncomingBubbleStacked,
                      ]}
                    >
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
            {courierQuickReplies.map(reply => {
              const isPrimary = reply === 'I’m coming'
              const isSecondary = reply === 'Leave at door'

              return (
                <Pressable
                  key={reply}
                  accessibilityRole="button"
                  onPress={() => pushUserChatMessage(reply)}
                  style={[
                    styles.chatReplyChip,
                    isPrimary && styles.chatReplyChipPrimary,
                    isSecondary && styles.chatReplyChipSecondary,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.chatReplyText,
                      isPrimary && styles.chatReplyTextPrimary,
                      isSecondary && styles.chatReplyTextSecondary,
                    ]}
                  >
                    {reply}
                  </Text>
                </Pressable>
              )
            })}

            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert('Call courier', '+1 (555) 123-4567')}
              style={styles.chatReplyChip}
            >
              <Feather name="phone-call" size={12} color="#191c1e" />
              <Text allowFontScaling={false} style={styles.chatReplyText}>
                Call me
              </Text>
            </Pressable>
          </ScrollView>

          <View style={styles.chatComposerRow}>
            <Pressable accessibilityRole="button" style={styles.chatPlusButton}>
              <Feather name="plus-circle" size={20} color="#58423c" />
            </Pressable>

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
              Enjoy your meal. Thanks for{'\n'}choosing us!
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
        provider={Platform.OS === 'ios' && hasGoogleMapsKey ? PROVIDER_GOOGLE : undefined}
        showsCompass={false}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <MapPolyline coordinates={routeCoordinates} strokeColor="#ffffff" strokeWidth={8} />
        <MapPolyline coordinates={routeCoordinates} strokeColor="#5f98ff" strokeWidth={4} />

        <Marker coordinate={restaurantCoords} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.restaurantMarkerHalo} />
          <View style={styles.restaurantMarker} />
        </Marker>

        <Marker coordinate={customerCoords} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.customerMarkerOuter}>
            <View style={styles.customerMarkerInner} />
          </View>
        </Marker>

        <Marker.Animated coordinate={animatedCourierCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.courierMarker}>
            <View style={styles.courierDot} />
          </View>
        </Marker.Animated>
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
                            <MaterialCommunityIcons
                              name="silverware-fork-knife"
                              size={14}
                              color="#ffffff"
                            />
                          ) : null}
                          {isActive && step.key === 'pickedUp' ? (
                            <MaterialCommunityIcons
                              name="bike-fast"
                              size={14}
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



              <View style={styles.bottomActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert('Cancel order', 'Order cancellation is not connected yet.')
                  }
                  style={[styles.bottomButton, styles.secondaryButton]}
                >
                  <Text allowFontScaling={false} style={styles.secondaryButtonText}>
                    Cancel order
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
})
