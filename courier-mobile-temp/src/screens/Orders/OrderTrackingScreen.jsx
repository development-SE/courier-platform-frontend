import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { ordersApi } from '../../api/orders.api'

const STATUS_LABELS = {
  NEW: { label: 'Новый', color: '#f59e0b', icon: '⏳' },
  ACCEPTED: { label: 'Принят', color: '#3b82f6', icon: '✅' },
  PREPARING: { label: 'Готовится', color: '#8b5cf6', icon: '👨‍🍳' },
  READY: { label: 'Готов', color: '#06b6d4', icon: '📦' },
  ASSIGNED: { label: 'Курьер назначен', color: '#3b82f6', icon: '🚴' },
  PICKED_UP: { label: 'Посылка забрана', color: '#8b5cf6', icon: '📦' },
  IN_TRANSIT: { label: 'В пути', color: '#FC3F1D', icon: '🚚' },
  DELIVERED: { label: 'Доставлено', color: '#10b981', icon: '✅' },
  CANCELLED: { label: 'Отменён', color: '#6b7280', icon: '❌' },
  REJECTED: { label: 'Отклонён', color: '#ef4444', icon: '🚫' },
}

const ASTANA_CENTER = { latitude: 51.1694, longitude: 71.4491 }
const ASTANA_DELIVERY_FALLBACK = { latitude: 51.1794, longitude: 71.4591 }

export const OrderTrackingScreen = ({ navigation, route }) => {
  const { orderId } = route.params || {}
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geocodedAddresses, setGeocodedAddresses] = useState({})
  const [routeCoords, setRouteCoords] = useState([])
  const mapRef = useRef(null)

  const isValidCoordinate = (value) => typeof value === 'number' && Number.isFinite(value)

  const getAddressCoordinates = (address) => {
    if (!address) return null

    const latitude = Number(address.latitude)
    const longitude = Number(address.longitude)

    if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
      return null
    }

    return { latitude, longitude }
  }

  const geocodeAddress = async (address) => {
    if (!address?.street || !address?.city) return null

    const queries = [
      `${address.street}, ${address.city}, Kazakhstan`,
      `${address.street}, Astana, Kazakhstan`,
      address.street,
    ]

    for (const query of queries) {
      try {
        const results = await Location.geocodeAsync(query)
        if (results?.[0]) {
          return {
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          }
        }
      } catch (err) {
        console.warn('Geocoding failed for', query, err)
      }
    }

    if (address.city === 'Астана' || address.city === 'Nur-Sultan') {
      return ASTANA_CENTER
    }

    return null
  }

  const fetchRoute = async (origin, destination) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
      const response = await fetch(url)
      const data = await response.json()

      if (data.routes?.[0]?.geometry?.coordinates) {
        setRouteCoords(
          data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }))
        )
        return
      }
    } catch (err) {
      console.warn('Failed to fetch route from OSRM:', err)
    }

    setRouteCoords([])
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await ordersApi.getById(orderId)
        const orderData = res.data || res

        let cachedCoords = null
        try {
          const cached = await AsyncStorage.getItem(`order_${orderId}`)
          cachedCoords = cached ? JSON.parse(cached) : null
        } catch (e) {
          console.warn('Failed to load cached coordinates:', e)
        }

        setOrder(orderData)

        const orderPickupCoords = getAddressCoordinates(orderData?.pickupAddress)
        const orderDeliveryCoords = getAddressCoordinates(orderData?.deliveryAddress)

        const cachedPickupCoords =
          isValidCoordinate(cachedCoords?.pickupLat) && isValidCoordinate(cachedCoords?.pickupLon)
            ? {
                latitude: Number(cachedCoords.pickupLat),
                longitude: Number(cachedCoords.pickupLon),
              }
            : null

        const cachedDeliveryCoords =
          isValidCoordinate(cachedCoords?.deliveryLat) && isValidCoordinate(cachedCoords?.deliveryLon)
            ? {
                latitude: Number(cachedCoords.deliveryLat),
                longitude: Number(cachedCoords.deliveryLon),
              }
            : null

        const [geocodedPickupCoords, geocodedDeliveryCoords] = await Promise.all([
          orderPickupCoords || cachedPickupCoords ? null : geocodeAddress(orderData?.pickupAddress),
          orderDeliveryCoords || cachedDeliveryCoords ? null : geocodeAddress(orderData?.deliveryAddress),
        ])

        setGeocodedAddresses({
          pickup: orderPickupCoords || cachedPickupCoords || geocodedPickupCoords || ASTANA_CENTER,
          delivery:
            orderDeliveryCoords ||
            cachedDeliveryCoords ||
            geocodedDeliveryCoords ||
            ASTANA_DELIVERY_FALLBACK,
        })
      } catch (err) {
        console.error('Failed to load order:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [orderId])

  useEffect(() => {
    if (!geocodedAddresses.pickup || !geocodedAddresses.delivery || !mapRef.current) return

    const coords = [geocodedAddresses.pickup, geocodedAddresses.delivery]
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
        animated: true,
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [geocodedAddresses])

  useEffect(() => {
    if (!geocodedAddresses.pickup || !geocodedAddresses.delivery) {
      setRouteCoords([])
      return
    }

    fetchRoute(geocodedAddresses.pickup, geocodedAddresses.delivery)
  }, [geocodedAddresses])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC3F1D" />
      </View>
    )
  }

  const status = STATUS_LABELS[order?.status] || STATUS_LABELS.NEW
  const pickupLocation = geocodedAddresses.pickup || ASTANA_CENTER
  const deliveryLocation = geocodedAddresses.delivery || ASTANA_DELIVERY_FALLBACK
  const courierLocation = { latitude: 51.172, longitude: 71.445 }
  const polylineCoords =
    routeCoords.length > 1 ? routeCoords : [pickupLocation, deliveryLocation]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Отслеживание</Text>
        <View style={{ width: 40 }} />
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
        <Marker coordinate={pickupLocation} title="Откуда">
          <View style={styles.markerGreen}>
            <Text style={styles.markerText}>A</Text>
          </View>
        </Marker>

        <Marker coordinate={deliveryLocation} title="Куда">
          <View style={styles.markerRed}>
            <Text style={styles.markerText}>B</Text>
          </View>
        </Marker>

        <Polyline
          coordinates={polylineCoords}
          strokeColor="#FC3F1D"
          strokeWidth={4}
          lineDashPattern={routeCoords.length > 1 ? undefined : [8, 4]}
        />

        {(order?.status === 'IN_TRANSIT' || order?.status === 'ASSIGNED') && (
          <Marker coordinate={courierLocation} title="Курьер">
            <View style={styles.courierMarker}>
              <Text style={{ fontSize: 20 }}>🚴</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.infoCard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{status.icon}</Text>
            <View>
              <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
              <Text style={styles.orderId}>Заказ #{order?.orderId?.slice(-6)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.routeSection}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#10b981' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Адрес отправления</Text>
                <Text style={styles.routeAddress}>
                  {order?.pickupAddress?.street || 'Адрес отправления'}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#FC3F1D' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Адрес доставки</Text>
                <Text style={styles.routeAddress}>
                  {order?.deliveryAddress?.street || 'Адрес доставки'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.recipientRow}>
            <Text style={styles.recipientIcon}>👤</Text>
            <View>
              <Text style={styles.recipientName}>
                {order?.recipientInfo?.name || 'Получатель'}
              </Text>
              <Text style={styles.recipientPhone}>{order?.recipientInfo?.phone || ''}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 22, color: '#FC3F1D', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#0d0d0d' },
  map: { flex: 1 },
  markerGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FC3F1D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  courierMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusIcon: { fontSize: 28 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  orderId: { fontSize: 12, color: '#aaa', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  routeSection: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase' },
  routeAddress: { fontSize: 14, color: '#0d0d0d', fontWeight: '500', marginTop: 2 },
  routeLine: {
    width: 1,
    height: 14,
    backgroundColor: '#e0e0e0',
    marginLeft: 4.5,
    marginVertical: 2,
  },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipientIcon: { fontSize: 24 },
  recipientName: { fontSize: 15, fontWeight: '700', color: '#0d0d0d' },
  recipientPhone: { fontSize: 13, color: '#888', marginTop: 2 },
})
