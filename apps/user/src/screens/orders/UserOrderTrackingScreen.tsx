import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getUserOrder, type UserOrder, type UserOrderAddress } from '../../data/ordersApi'
import { getOrderAssignment, getCourierLocation, autoAssignOrder } from '../../data/logisticsApi'

type UserOrderTrackingScreenProps = {
  accessToken?: string
  initialOrder: UserOrder
  onBackPress?: () => void
  onUnauthorized?: () => void
}

const STATUS_CONFIG: Record<
  string,
  {
    sectionLabel: string
    color: string
    icon: keyof typeof Feather.glyphMap
  }
> = {
  NEW: { sectionLabel: 'Waiting', color: '#B26B00', icon: 'clock' },
  ACCEPTED: { sectionLabel: 'In progress', color: '#004397', icon: 'check-circle' },
  PREPARING: { sectionLabel: 'In progress', color: '#004397', icon: 'package' },
  READY: { sectionLabel: 'In progress', color: '#004397', icon: 'package' },
  ASSIGNED: { sectionLabel: 'In progress', color: '#004397', icon: 'truck' },
  PICKED_UP: { sectionLabel: 'In progress', color: '#004397', icon: 'truck' },
  IN_TRANSIT: { sectionLabel: 'On the way', color: '#004397', icon: 'navigation' },
  DELIVERY_CONFIRMATION_PENDING: { sectionLabel: 'Confirming', color: '#A7391E', icon: 'shield' },
  DELIVERED: { sectionLabel: 'Delivered', color: '#2C4E2E', icon: 'check-circle' },
  CANCELLED: { sectionLabel: 'Cancelled', color: '#6B7280', icon: 'x-circle' },
  REJECTED: { sectionLabel: 'Rejected', color: '#EF4444', icon: 'slash' },
}

const SERVICE_TYPE_LABEL: Record<string, string> = {
  FOOD: 'Food delivery',
  STANDARD: 'Courier',
  EXPRESS: 'Express',
  SCHEDULED: 'Scheduled',
}

const ASTANA_CENTER = { latitude: 51.128200, longitude: 71.430400 }
const ASTANA_DELIVERY_FALLBACK = { latitude: 51.140000, longitude: 71.440000 }

function formatAddress(address?: UserOrderAddress) {
  if (!address) return 'Address unavailable'

  const parts = [
    address.city?.trim(),
    address.street?.trim(),
    address.house?.trim(),
    address.apartment?.trim() ? `apt ${address.apartment.trim()}` : '',
  ].filter(Boolean)

  return parts.length ? parts.join(', ') : 'Address unavailable'
}

function formatOrderCode(orderId?: string) {
  if (!orderId) return '#------'
  return `#${String(orderId).slice(0, 8)}`
}

function formatAmount(order: UserOrder) {
  const value = typeof order.totalAmount === 'number' && !Number.isNaN(order.totalAmount) ? order.totalAmount : 0

  if (order.serviceType === 'FOOD') {
    return `$${value.toFixed(2)}`
  }

  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })} KZT`
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

  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
    return null
  }

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
      const results = await Location.geocodeAsync(query)
      if (results[0]) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        }
      }
    } catch {
      // Ignore transient geocoder failures and try the next variant.
    }
  }

  return null
}

async function fetchRouteCoordinates(
  origin: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number } | null,
) {
  if (!origin || !destination) {
    return []
  }

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
        .filter(point => isValidCoordinate(point.latitude) && isValidCoordinate(point.longitude))

      if (coords.length > 1) {
        return coords
      }
    }
  } catch {
    // Fall back to straight line when routing is unavailable.
  }

  return [origin, destination]
}

export function UserOrderTrackingScreen({
  accessToken,
  initialOrder,
  onBackPress,
  onUnauthorized,
}: UserOrderTrackingScreenProps) {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + 56
  const mapRef = useRef<MapView | null>(null)
  const sheetTranslateY = useRef(new Animated.Value(0)).current
  const dragStartTranslateY = useRef(0)
  const maxTranslateRef = useRef(0)
  const isSheetCollapsedRef = useRef(false)
  const [order, setOrder] = useState<UserOrder>(initialOrder)
  const [isLoading, setIsLoading] = useState(initialOrder.serviceType !== 'FOOD')
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false)
  const [cardHeight, setCardHeight] = useState(0)
  const [resolvedCoords, setResolvedCoords] = useState<{
    pickup: { latitude: number; longitude: number } | null
    delivery: { latitude: number; longitude: number } | null
  }>({
    pickup: getAddressCoordinates(initialOrder.pickupAddress),
    delivery: getAddressCoordinates(initialOrder.deliveryAddress),
  })
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([])

  const [courierId, setCourierId] = useState<string | null>(null)
  const [realCourierLocation, setRealCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [courierOnline, setCourierOnline] = useState<boolean>(false)

  useEffect(() => {
    setOrder(initialOrder)
  }, [initialOrder])

  useEffect(() => {
    if (!accessToken || initialOrder.serviceType === 'FOOD') {
      setIsLoading(false)
      return
    }

    let isActive = true
    let pollTimer: NodeJS.Timeout

    const poll = async (isInitial = false) => {
      if (isInitial) setIsLoading(true)
      try {
        // 1. Fetch latest order state from order-service
        const orderRes = await getUserOrder(accessToken, initialOrder.orderId)
        if (!isActive) return

        if (!orderRes.ok) {
          if (orderRes.error.status === 401) {
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
          setOrder(prev => ({
            ...prev,
            ...latestOrder
          }))
          
          if (latestOrder.status === 'NEW') {
            void autoAssignOrder(accessToken, initialOrder.orderId)
          }
        }

        // Check if order status is terminal
        const isTerminal = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(latestOrder?.status || '')
        if (isTerminal) {
          setCourierId(null)
          setRealCourierLocation(null)
          return
        }

        // 2. Fetch active assignment from logistics-service
        const assignRes = await getOrderAssignment(accessToken, initialOrder.orderId)
        if (!isActive) return

        if (assignRes.ok && assignRes.data.success && assignRes.data.data) {
          const content = assignRes.data.data.content
          if (content && content.length > 0) {
            const activeAssign = content[0]
            if (activeAssign.courierId) {
              setCourierId(activeAssign.courierId)
              
              // 3. Fetch courier location
              const locRes = await getCourierLocation(accessToken, activeAssign.courierId)
              if (!isActive) return

              if (locRes.ok && locRes.data.success && locRes.data.data) {
                const locData = locRes.data.data
                setRealCourierLocation({
                  latitude: locData.latitude,
                  longitude: locData.longitude
                })
                setCourierOnline(locData.isOnline)
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
          pollTimer = setTimeout(() => void poll(), 5000) // Poll every 5 seconds
        }
      }
    }

    void poll(true)

    return () => {
      isActive = false
      clearTimeout(pollTimer)
    }
  }, [accessToken, initialOrder.orderId, initialOrder.serviceType, onUnauthorized])

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
          ? {
              latitude: Number(cachedCoords.pickupLat),
              longitude: Number(cachedCoords.pickupLon),
            }
          : null

      const cachedDelivery =
        isValidCoordinate(cachedCoords?.deliveryLat) && isValidCoordinate(cachedCoords?.deliveryLon)
          ? {
              latitude: Number(cachedCoords.deliveryLat),
              longitude: Number(cachedCoords.deliveryLon),
            }
          : null

      const [geocodedPickup, geocodedDelivery] = await Promise.all([
        directPickup || cachedPickup ? Promise.resolve(null) : geocodeAddress(order.pickupAddress),
        directDelivery || cachedDelivery ? Promise.resolve(null) : geocodeAddress(order.deliveryAddress),
      ])

      if (!isActive) {
        return
      }

      setResolvedCoords({
        pickup: directPickup || cachedPickup || geocodedPickup || ASTANA_CENTER,
        delivery: directDelivery || cachedDelivery || geocodedDelivery || ASTANA_DELIVERY_FALLBACK,
      })
    }

    void loadCoordinates()

    return () => {
      isActive = false
    }
  }, [order])

  useEffect(() => {
    if (!resolvedCoords.pickup || !resolvedCoords.delivery) {
      return
    }

    const bottomPadding = isSheetCollapsed ? 176 : 360
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates([resolvedCoords.pickup!, resolvedCoords.delivery!], {
        edgePadding: {
          top: headerHeight + 20,
          right: 56,
          bottom: bottomPadding,
          left: 56,
        },
        animated: true,
      })
    }, 320)

    return () => clearTimeout(timer)
  }, [headerHeight, isSheetCollapsed, resolvedCoords])

  useEffect(() => {
    let isActive = true

    const buildRoute = async () => {
      const nextRoute = await fetchRouteCoordinates(resolvedCoords.pickup, resolvedCoords.delivery)
      if (isActive) {
        setRouteCoords(nextRoute)
      }
    }

    void buildRoute()

    return () => {
      isActive = false
    }
  }, [resolvedCoords])

  useEffect(() => {
    isSheetCollapsedRef.current = isSheetCollapsed
  }, [isSheetCollapsed])

  const syncSheetPosition = (collapsed: boolean, animated = true) => {
    const targetValue = collapsed ? maxTranslateRef.current : 0

    if (!animated) {
      sheetTranslateY.setValue(targetValue)
      return
    }

    Animated.spring(sheetTranslateY, {
      toValue: targetValue,
      tension: 58,
      friction: 10,
      useNativeDriver: true,
    }).start()
  }

  const setSheetCollapsedState = (collapsed: boolean, animated = true) => {
    isSheetCollapsedRef.current = collapsed
    setIsSheetCollapsed(collapsed)
    syncSheetPosition(collapsed, animated)
  }

  useEffect(() => {
    const collapsedVisibleHeight = 134
    maxTranslateRef.current = Math.max(0, cardHeight - collapsedVisibleHeight)
    syncSheetPosition(isSheetCollapsedRef.current, false)
  }, [cardHeight])

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        maxTranslateRef.current > 0 &&
        Math.abs(gestureState.dy) > 4 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
        maxTranslateRef.current > 0 &&
        Math.abs(gestureState.dy) > 4 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation(value => {
          dragStartTranslateY.current = value
        })
      },
      onPanResponderMove: (_event, gestureState) => {
        const maxTranslate = maxTranslateRef.current
        const nextValue = Math.max(
          0,
          Math.min(maxTranslate, dragStartTranslateY.current + gestureState.dy),
        )
        sheetTranslateY.setValue(nextValue)
      },
      onPanResponderRelease: (_event, gestureState) => {
        const maxTranslate = maxTranslateRef.current

        if (Math.abs(gestureState.dy) < 6 && Math.abs(gestureState.vy) < 0.12) {
          setSheetCollapsedState(!isSheetCollapsedRef.current)
          return
        }

        const currentValue = Math.max(
          0,
          Math.min(maxTranslate, dragStartTranslateY.current + gestureState.dy),
        )
        const shouldCollapse =
          gestureState.vy > 0.35 || currentValue > maxTranslate * 0.42

        setSheetCollapsedState(shouldCollapse)
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        syncSheetPosition(isSheetCollapsedRef.current)
      },
    }),
  ).current

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW

  const routeLineCoords = useMemo(() => {
    if (routeCoords.length > 1) return routeCoords
    if (resolvedCoords.pickup && resolvedCoords.delivery) {
      return [resolvedCoords.pickup, resolvedCoords.delivery]
    }
    return []
  }, [resolvedCoords.delivery, resolvedCoords.pickup, routeCoords])

  const courierLocation = useMemo(() => {
    if (!['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERY_CONFIRMATION_PENDING'].includes(order.status)) {
      return null
    }
    return realCourierLocation
  }, [order.status, realCourierLocation])

  const itemNames = (order.items ?? [])
    .map(item => item.name?.trim())
    .filter(Boolean)
    .join(', ')

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingTop: insets.top + 2,
          },
        ]}
      >
        <TouchableOpacity onPress={onBackPress} style={styles.headerButton} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color="#191C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerButton} />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: ASTANA_CENTER.latitude,
          longitude: ASTANA_CENTER.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {resolvedCoords.pickup ? (
          <Marker coordinate={resolvedCoords.pickup} title="Origin">
            <View style={styles.markerPickup}>
              <Text style={styles.markerText}>A</Text>
            </View>
          </Marker>
        ) : null}

        {resolvedCoords.delivery ? (
          <Marker coordinate={resolvedCoords.delivery} title="Destination">
            <View style={styles.markerDelivery}>
              <Text style={styles.markerText}>B</Text>
            </View>
          </Marker>
        ) : null}

        {routeLineCoords.length > 1 ? (
          <Polyline coordinates={routeLineCoords} strokeColor="#A7391E" strokeWidth={4} />
        ) : null}

        {courierLocation ? (
          <Marker coordinate={courierLocation} title="Courier">
            <View style={styles.courierMarker}>
              <MaterialCommunityIcons name="bike-fast" size={20} color="#A7391E" />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.cardWrapper, { paddingBottom: Math.max(24, insets.bottom + 10) }]}>
        <Animated.View
          onLayout={event => {
            const nextHeight = event.nativeEvent.layout.height
            if (nextHeight && nextHeight !== cardHeight) {
              setCardHeight(nextHeight)
            }
          }}
          style={[
            styles.card,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View {...sheetPanResponder.panHandlers} style={styles.sheetDragArea}>
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandlePill} />
            </View>

            <View style={styles.sheetTopRow}>
              <View style={[styles.statusIconWrap, { backgroundColor: `${status.color}18` }]}>
                <Feather name={status.icon} size={18} color={status.color} />
              </View>
              <View style={styles.statusCopy}>
                <Text style={[styles.statusLabel, { color: status.color }]}>{status.sectionLabel}</Text>
                <Text style={styles.orderCode}>{formatOrderCode(order.orderId)}</Text>
              </View>
              <View style={styles.sheetAmountChip}>
                <Text style={styles.sheetAmountValue}>{formatAmount(order)}</Text>
              </View>
              {isLoading ? <ActivityIndicator size="small" color="#A7391E" /> : null}
            </View>

            <View style={styles.collapsedRouteRow}>
              <View style={styles.collapsedRouteDotPickup} />
              <Text style={styles.collapsedRouteText} numberOfLines={1}>
                {formatAddress(order.pickupAddress)}
              </Text>
              <Feather name="arrow-right" size={14} color="#8D776F" />
              <View style={styles.collapsedRouteDotDelivery} />
              <Text style={styles.collapsedRouteText} numberOfLines={1}>
                {formatAddress(order.deliveryAddress)}
              </Text>
            </View>
          </View>

          <ScrollView
            scrollEnabled={!isSheetCollapsed}
            showsVerticalScrollIndicator={false}
            pointerEvents={isSheetCollapsed ? 'none' : 'auto'}
            contentContainerStyle={styles.cardContent}
          >

            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Type</Text>
                <Text style={styles.summaryChipValue}>
                  {SERVICE_TYPE_LABEL[order.serviceType ?? ''] ?? order.serviceType ?? 'Delivery'}
                </Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Amount</Text>
                <Text style={styles.summaryChipValue}>{formatAmount(order)}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Created</Text>
                <Text style={styles.summaryChipValue}>{formatCreatedAt(order.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.routeSection}>
              <View style={styles.routeTrack}>
                <View style={styles.dotPickup} />
                <View style={styles.trackLine} />
                <View style={styles.dotDelivery} />
              </View>

              <View style={styles.routeCopy}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeValue}>{formatAddress(order.pickupAddress)}</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeLabel}>Delivery</Text>
                  <Text style={styles.routeValue}>{formatAddress(order.deliveryAddress)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.contactSection}>
              <View style={styles.contactBlock}>
                <Text style={styles.contactLabel}>Sender</Text>
                <Text style={styles.contactName}>{order.pickupInfo?.name?.trim() || 'Sender'}</Text>
                <Text style={styles.contactMeta}>{order.pickupInfo?.phone?.trim() || 'Phone unavailable'}</Text>
              </View>

              <View style={styles.contactBlock}>
                <Text style={styles.contactLabel}>Receiver</Text>
                <Text style={styles.contactName}>{order.recipientInfo?.name?.trim() || 'Receiver'}</Text>
                <Text style={styles.contactMeta}>{order.recipientInfo?.phone?.trim() || 'Phone unavailable'}</Text>
              </View>
            </View>

            {itemNames ? (
              <>
                <View style={styles.divider} />
                <View style={styles.textSection}>
                  <Text style={styles.sectionCaption}>Items</Text>
                  <Text style={styles.sectionBody}>{itemNames}</Text>
                </View>
              </>
            ) : null}

            {order.comment?.trim() ? (
              <>
                <View style={styles.divider} />
                <View style={styles.textSection}>
                  <Text style={styles.sectionCaption}>Comment</Text>
                  <Text style={styles.sectionBody}>{order.comment.trim()}</Text>
                </View>
              </>
            ) : null}

            {order.deliveryConfirmationCode ? (
              <>
                <View style={styles.divider} />
                <View style={styles.codeCard}>
                  <Text style={styles.codeLabel}>Delivery confirmation code</Text>
                  <Text style={styles.codeValue}>{order.deliveryConfirmationCode}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247,249,251,0.88)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191C1E',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  map: {
    flex: 1,
  },
  markerPickup: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#446744',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerDelivery: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A7391E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  courierMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    maxHeight: 420,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(223,192,184,0.15)',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  sheetDragArea: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEC',
    gap: 14,
  },
  sheetHandleRow: {
    alignItems: 'center',
  },
  sheetHandlePill: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E7E2DE',
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetAmountChip: {
    borderRadius: 999,
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sheetAmountValue: {
    color: '#A7391E',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  orderCode: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#58423C',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryChip: {
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 16,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryChipLabel: {
    color: '#8D776F',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryChipValue: {
    color: '#191C1E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F4F6',
  },
  routeSection: {
    flexDirection: 'row',
    gap: 16,
  },
  collapsedRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  collapsedRouteDotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#446744',
  },
  collapsedRouteDotDelivery: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A7391E',
  },
  collapsedRouteText: {
    flex: 1,
    color: '#191C1E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  routeTrack: {
    width: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dotPickup: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#446744',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  trackLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E3E5',
    marginVertical: 2,
    minHeight: 40,
  },
  dotDelivery: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#A7391E',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  routeCopy: {
    flex: 1,
    gap: 16,
  },
  routeItem: {
    gap: 4,
  },
  routeLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#58423C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeValue: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191C1E',
  },
  contactSection: {
    gap: 14,
  },
  contactBlock: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contactLabel: {
    color: '#8D776F',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contactName: {
    color: '#191C1E',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  contactMeta: {
    color: '#5B4941',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  textSection: {
    gap: 6,
  },
  sectionCaption: {
    color: '#8D776F',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBody: {
    color: '#191C1E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  codeCard: {
    borderRadius: 20,
    backgroundColor: '#FFF3EE',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeLabel: {
    color: '#A7391E',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  codeValue: {
    color: '#A7391E',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 1.2,
  },
})
