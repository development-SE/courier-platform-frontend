import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
  Alert, Platform, Animated, Dimensions,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { ordersApi } from '../../api/orders.api'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ─── Transport options (like Yandex Go) ──────────────────────────────────────
const TRANSPORT_TYPES = [
  {
    id: 'STANDARD',
    icon: '🛵',
    label: 'Курьер',
    desc: '~30 мин',
    basePrice: 800,
  },
  {
    id: 'EXPRESS',
    icon: '⚡',
    label: 'Экспресс',
    desc: '~15 мин',
    basePrice: 1500,
  },
  {
    id: 'CARGO',
    icon: '🚚',
    label: 'Груз',
    desc: '~45 мин',
    basePrice: 3000,
  },
]

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEP_MAP     = 'map'       // pick pickup on map
const STEP_DEST    = 'dest'      // pick destination
const STEP_DETAILS = 'details'   // recipient + transport + confirm

export const CreateOrderScreen = ({ navigation }) => {
  const mapRef = useRef(null)

  // Location
  const [myLocation, setMyLocation] = useState(null)

  // Step state
  const [step, setStep] = useState(STEP_MAP)

  // Addresses
  const [pickupCoords, setPickupCoords]   = useState(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [destCoords, setDestCoords]       = useState(null)
  const [destAddress, setDestAddress]     = useState('')

  // Details
  const [transport, setTransport]         = useState(TRANSPORT_TYPES[0])
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDesc, setPackageDesc]     = useState('')
  const [notes, setNotes]                 = useState('')
  const [loading, setLoading]             = useState(false)

  // Bottom sheet animation
  const sheetAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: 1, tension: 50, friction: 9, useNativeDriver: true,
    }).start()
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }
      setMyLocation(coords)
      setPickupCoords(coords)
      reverseGeocode(coords, setPickupAddress)
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800)
    })()
  }, [])

  // ── Reverse geocode using expo-location ──────────────────────────────────
  const reverseGeocode = async (coords, setter) => {
    try {
      const res = await Location.reverseGeocodeAsync(coords)
      if (res[0]) {
        const r = res[0]
        const parts = [r.street, r.streetNumber, r.city].filter(Boolean)
        setter(parts.join(', ') || 'Выбранная точка')
      }
    } catch {
      setter('Выбранная точка')
    }
  }

  // ── Map press handler ────────────────────────────────────────────────────
  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate
    if (step === STEP_MAP) {
      setPickupCoords(coords)
      reverseGeocode(coords, setPickupAddress)
    } else if (step === STEP_DEST) {
      setDestCoords(coords)
      reverseGeocode(coords, setDestAddress)
    }
  }

  // ── Estimated price ──────────────────────────────────────────────────────
  const estimatedPrice = () => {
    if (!pickupCoords || !destCoords) return transport.basePrice
    const R = 6371
    const dLat = ((destCoords.latitude  - pickupCoords.latitude)  * Math.PI) / 180
    const dLon = ((destCoords.longitude - pickupCoords.longitude) * Math.PI) / 180
    const a = Math.sin(dLat/2)**2 +
              Math.cos(pickupCoords.latitude * Math.PI/180) *
              Math.cos(destCoords.latitude   * Math.PI/180) *
              Math.sin(dLon/2)**2
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(transport.basePrice + dist * 150)
  }

  // ── Submit order ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!recipientName || !recipientPhone) {
      Alert.alert('Ошибка', 'Укажите имя и телефон получателя')
      return
    }
    setLoading(true)
    try {
      await ordersApi.create({
        pickupAddress,
        deliveryAddress: destAddress,
        pickupLat:  pickupCoords?.latitude,
        pickupLon:  pickupCoords?.longitude,
        deliveryLat: destCoords?.latitude,
        deliveryLon:  destCoords?.longitude,
        recipientName,
        recipientPhone,
        packageDescription: packageDesc,
        notes,
        transportType: transport.id,
        estimatedPrice: estimatedPrice(),
      })
      Alert.alert('Заказ создан!', 'Курьер будет назначен в ближайшее время', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') },
      ])
    } catch (err) {
  console.log('ERROR RESPONSE:', JSON.stringify(err?.response?.data, null, 2))
  console.log('ERROR STATUS:', err?.response?.status)
  const data = err?.response?.data
  const msg = typeof data === 'string'
    ? data
    : data?.message
    || data?.error
    || data?.detail
    || err?.message
    || 'Unknown error'
  Alert.alert('Ошибка', String(msg))
} finally {
      setLoading(false)
    }
  }

  // ── Region for map ───────────────────────────────────────────────────────
  const initialRegion = myLocation
    ? { ...myLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 51.1694, longitude: 71.4491, latitudeDelta: 0.05, longitudeDelta: 0.05 }

  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1], outputRange: [300, 0],
  })

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Back button ── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* ── Step indicator ── */}
      <View style={styles.stepBadge}>
        <Text style={styles.stepText}>
          {step === STEP_MAP ? '📍 Откуда' : step === STEP_DEST ? '🏁 Куда' : '📋 Детали'}
        </Text>
      </View>

      {/* ── Map ── */}
      {step !== STEP_DETAILS && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {pickupCoords && (
            <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.markerA}>
                <Text style={styles.markerLetter}>A</Text>
              </View>
            </Marker>
          )}
          {destCoords && (
            <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.markerB}>
                <Text style={styles.markerLetter}>B</Text>
              </View>
            </Marker>
          )}
          {pickupCoords && destCoords && (
            <Polyline
              coordinates={[pickupCoords, destCoords]}
              strokeColor="#FC3F1D"
              strokeWidth={3}
              lineDashPattern={[6, 4]}
            />
          )}
        </MapView>
      )}

      {/* ── Crosshair hint ── */}
      {step !== STEP_DETAILS && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            {step === STEP_MAP
              ? 'Нажмите на карту, чтобы выбрать точку отправления'
              : 'Нажмите на карту, чтобы выбрать точку назначения'}
          </Text>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM SHEET
      ══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetTranslate }] }]}
      >
        <View style={styles.handle} />

        {/* ── STEP 1: Pickup ─────────────────────────────────────────── */}
        {step === STEP_MAP && (
          <View>
            <Text style={styles.sheetTitle}>Откуда забрать?</Text>

            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>ОТКУДА</Text>
                <Text style={styles.addressValue} numberOfLines={1}>
                  {pickupAddress || 'Нажмите на карту...'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, !pickupCoords && styles.actionBtnDisabled]}
              disabled={!pickupCoords}
              onPress={() => setStep(STEP_DEST)}
            >
              <Text style={styles.actionBtnText}>Выбрать точку назначения →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Destination ────────────────────────────────────── */}
        {step === STEP_DEST && (
          <View>
            <Text style={styles.sheetTitle}>Куда доставить?</Text>

            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>ОТКУДА</Text>
                <Text style={styles.addressValue} numberOfLines={1}>{pickupAddress}</Text>
              </View>
            </View>

            <View style={[styles.addressRow, { marginTop: 8 }]}>
              <View style={[styles.dot, { backgroundColor: '#FC3F1D' }]} />
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>КУДА</Text>
                <Text style={styles.addressValue} numberOfLines={1}>
                  {destAddress || 'Нажмите на карту...'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, !destCoords && styles.actionBtnDisabled]}
              disabled={!destCoords}
              onPress={() => setStep(STEP_DETAILS)}
            >
              <Text style={styles.actionBtnText}>Далее →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep(STEP_MAP)}>
              <Text style={styles.backLinkText}>← Изменить откуда</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: Details ───────────────────────────────────────── */}
        {step === STEP_DETAILS && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Route summary */}
            <View style={styles.routeSummary}>
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.summaryText} numberOfLines={1}>{pickupAddress}</Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: '#FC3F1D' }]} />
                <Text style={styles.summaryText} numberOfLines={1}>{destAddress}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(STEP_MAP)}>
                <Text style={styles.editRoute}>Изменить маршрут</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Transport selector */}
            <Text style={styles.sectionLabel}>Тип доставки</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.transportRow}>
              {TRANSPORT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.transportCard, transport.id === t.id && styles.transportCardActive]}
                  onPress={() => setTransport(t)}
                >
                  <Text style={styles.transportIcon}>{t.icon}</Text>
                  <Text style={[styles.transportLabel, transport.id === t.id && styles.transportLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.transportDesc}>{t.desc}</Text>
                  <Text style={[styles.transportPrice, transport.id === t.id && styles.transportPriceActive]}>
                    от ₸{t.basePrice.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            {/* Recipient */}
            <Text style={styles.sectionLabel}>Получатель</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Имя получателя *"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              placeholder="+7 700 000 0000 *"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />

            <View style={styles.divider} />

            {/* Package */}
            <Text style={styles.sectionLabel}>Посылка</Text>
            <TextInput
              style={styles.input}
              value={packageDesc}
              onChangeText={setPackageDesc}
              placeholder="Что отправляем?"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, { marginTop: 10, height: 70 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Инструкции для курьера..."
              placeholderTextColor="#aaa"
              multiline
              textAlignVertical="top"
            />

            <View style={styles.divider} />

            {/* Price + confirm */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Стоимость</Text>
                <Text style={styles.priceValue}>≈ ₸{estimatedPrice().toLocaleString()}</Text>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmBtnText}>Оформить заказ</Text>
                }
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4, zIndex: 10,
  },
  backText: { fontSize: 20, color: '#FC3F1D', fontWeight: '700' },

  stepBadge: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36,
    alignSelf: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, zIndex: 10,
  },
  stepText: { fontSize: 14, fontWeight: '700', color: '#0d0d0d' },

  map: { flex: 1 },

  hint: {
    position: 'absolute', bottom: 290, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    padding: 10, alignItems: 'center',
  },
  hintText: { color: '#fff', fontSize: 13, textAlign: 'center' },

  markerA: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  markerB: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FC3F1D', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  markerLetter: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.65,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0d0d0d', marginBottom: 16 },

  // ── Address rows
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  addressBox: { flex: 1 },
  addressLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 0.5 },
  addressValue: { fontSize: 15, fontWeight: '600', color: '#0d0d0d', marginTop: 2 },

  routeConnector: {
    width: 1, height: 16, backgroundColor: '#e0e0e0', marginLeft: 4.5, marginVertical: 4,
  },
  routeSummary: { marginBottom: 4 },
  summaryText: { fontSize: 14, color: '#0d0d0d', fontWeight: '500', flex: 1 },
  editRoute: { fontSize: 13, color: '#FC3F1D', fontWeight: '600', marginTop: 10 },

  actionBtn: {
    backgroundColor: '#FC3F1D', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  actionBtnDisabled: { backgroundColor: '#fca58f' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  backLink: { alignItems: 'center', marginTop: 12 },
  backLinkText: { color: '#FC3F1D', fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase' },

  // ── Transport
  transportRow: { flexDirection: 'row', marginBottom: 4 },
  transportCard: {
    width: 100, borderRadius: 16, padding: 14, marginRight: 10,
    backgroundColor: '#f5f5f5', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  transportCardActive: { borderColor: '#FC3F1D', backgroundColor: '#fff5f3' },
  transportIcon: { fontSize: 28, marginBottom: 6 },
  transportLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
  transportLabelActive: { color: '#FC3F1D' },
  transportDesc: { fontSize: 11, color: '#aaa', marginTop: 2 },
  transportPrice: { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 6 },
  transportPriceActive: { color: '#FC3F1D' },

  // ── Input
  input: {
    borderWidth: 1, borderColor: '#ebebeb', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#0d0d0d', backgroundColor: '#fafafa',
  },

  // ── Price + confirm
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  priceLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  priceValue: { fontSize: 22, fontWeight: '800', color: '#0d0d0d', marginTop: 2 },
  confirmBtn: {
    backgroundColor: '#FC3F1D', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 16,
    shadowColor: '#FC3F1D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})