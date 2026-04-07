import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, TextInput, ScrollView,
  ActivityIndicator, Alert, Animated, Dimensions,
  KeyboardAvoidingView,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'

const { height: SCREEN_H } = Dimensions.get('window')

const TRANSPORT = [
  { id: 'STANDARD',  icon: '🛵', label: 'Курьер',    time: '~30 мин', base: 800  },
  { id: 'EXPRESS',   icon: '⚡',  label: 'Экспресс',  time: '~15 мин', base: 1500 },
  { id: 'SCHEDULED', icon: '🕐',  label: 'По времени', time: 'выбери время', base: 1200 },
]

// Haversine distance in km
const distanceKm = (a, b) => {
  const R = 6371
  const dLat = ((b.latitude  - a.latitude)  * Math.PI) / 180
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * Math.PI / 180) *
    Math.cos(b.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export const HomeScreen = ({ navigation }) => {
  const mapRef = useRef(null)

  // ── Location state
  const [myCoords, setMyCoords]       = useState(null)
  const [myAddress, setMyAddress]     = useState('Определяю местоположение...')
  const [destCoords, setDestCoords]   = useState(null)
  const [destAddress, setDestAddress] = useState('')
  const [routeCoords, setRouteCoords] = useState([])

  // ── UI state
  const [pickingDest, setPickingDest] = useState(false)   // map tap mode for destination
  const [pickingPickup, setPickingPickup] = useState(false) // map tap mode for pickup location
  const [transport, setTransport]     = useState(TRANSPORT[0])
  const [comment, setComment]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [locLoading, setLocLoading]   = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [showPayment, setShowPayment] = useState(false)
  const [cardNumber, setCardNumber]   = useState('')
  const [cardExpiry, setCardExpiry]   = useState('')
  const [cardCVV, setCardCVV]         = useState('')
  const [selectingCard, setSelectingCard] = useState(false)

  // ── Sheet animation
  const sheetY = useRef(new Animated.Value(400)).current

  const showSheet = () =>
    Animated.spring(sheetY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }).start()

  // ── On mount: get location
  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          setMyAddress('Нет доступа к геолокации')
          setLocLoading(false)
          showSheet()
          return
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
        setMyCoords(coords)
        centerMap(coords, 0.012)
        reverseGeocode(coords, setMyAddress)
      } catch {
        setMyAddress('Не удалось определить')
      } finally {
        setLocLoading(false)
        showSheet()
      }
    })()
  }, [])

  // ── Fetch route from OSRM (Open Source Routing Machine) - FREE!
  const fetchRoute = async (origin, destination) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.routes && data.routes[0] && data.routes[0].geometry) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
          longitude: lng,
          latitude: lat,
        }))
        setRouteCoords(coords)
      }
    } catch (err) {
      console.warn('Failed to fetch route from OSRM:', err)
    }
  }

  // ── Fetch route when both locations are set
  useEffect(() => {
    if (myCoords && destCoords) {
      fetchRoute(myCoords, destCoords)
    } else {
      setRouteCoords([])
    }
  }, [myCoords, destCoords])

  const centerMap = (coords, delta = 0.012) => {
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: delta, longitudeDelta: delta }, 700
    )
  }

  const reverseGeocode = async (coords, setter) => {
    try {
      const res = await Location.reverseGeocodeAsync(coords)
      if (res[0]) {
        const r = res[0]
        setter([r.street, r.streetNumber].filter(Boolean).join(' ') || r.city || 'Выбранная точка')
      }
    } catch {
      setter('Выбранная точка')
    }
  }

  // ── Tap on map to pick destination or pickup
  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate
    
    if (pickingPickup) {
      setMyCoords(coords)
      reverseGeocode(coords, setMyAddress)
      setPickingPickup(false)
      centerMap(coords, 0.012)
      return
    }
    
    if (pickingDest) {
      setDestCoords(coords)
      reverseGeocode(coords, setDestAddress)
      setPickingDest(false)
      // Zoom to show both markers
      if (myCoords) {
        mapRef.current?.fitToCoordinates([myCoords, coords], {
          edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
          animated: true,
        })
      }
    }
  }

  const startPickingPickup = () => {
    setPickingPickup(true)
    if (myCoords) centerMap(myCoords, 0.03)
  }

  const startPickingDest = () => {
    setPickingDest(true)
    if (myCoords) centerMap(myCoords, 0.03)
  }

  const clearDest = () => {
    setDestCoords(null)
    setDestAddress('')
    if (myCoords) centerMap(myCoords, 0.012)
  }

  // ── Price estimate
  const price = () => {
    if (!myCoords || !destCoords) return transport.base
    return Math.round(transport.base + distanceKm(myCoords, destCoords) * 150)
  }

  // ── Submit
  const handleOrder = () => {
    navigation.navigate('CreateOrder', {
      pickupAddress: myAddress,
      destAddress,
      comment,
      transportType: transport.id,
    })
  }

  const initialRegion = {
    latitude:  51.1694,
    longitude: 71.4491,
    latitudeDelta:  0.05,
    longitudeDelta: 0.05,
  }

  return (
    <View style={s.root}>

      {/* ════════════════════════════════════════
          MAP (full screen behind everything)
      ════════════════════════════════════════ */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsTraffic={false}
        pitchEnabled={false}
      >
        {/* Pickup marker (my location) */}
        {myCoords && (
          <Marker coordinate={myCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={s.markerA}>
              <Text style={s.markerLetter}>A</Text>
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destCoords && (
          <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={s.markerB}>
              <Text style={s.markerLetter}>B</Text>
            </View>
          </Marker>
        )}

        {/* Route line */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#FC3F1D"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* ── Picking destination overlay hint ── */}
      {pickingDest && (
        <View style={s.pickingOverlay} pointerEvents="none">
          <View style={s.pickingBadge}>
            <Text style={s.pickingText}>📍 Нажмите на карту чтобы выбрать пункт назначения</Text>
          </View>
        </View>
      )}

      {/* ── Picking pickup overlay hint ── */}
      {pickingPickup && (
        <View style={s.pickingOverlay} pointerEvents="none">
          <View style={s.pickingBadge}>
            <Text style={s.pickingText}>📍 Нажмите на карту чтобы выбрать пункт отправления</Text>
          </View>
        </View>
      )}

      {/* ── Cancel picking button ── */}
      {(pickingDest || pickingPickup) && (
        <TouchableOpacity style={s.cancelPick} onPress={() => { setPickingDest(false); setPickingPickup(false); }}>
          <Text style={s.cancelPickText}>✕ Отмена</Text>
        </TouchableOpacity>
      )}

      {/* ── My location button ── */}
      {!pickingDest && !pickingPickup && (
        <TouchableOpacity
          style={s.myLocBtn}
          onPress={() => myCoords && centerMap(myCoords)}
        >
          <Text style={s.myLocIcon}>🎯</Text>
        </TouchableOpacity>
      )}

      {/* ── Profile button (top right) ── */}
      {!pickingDest && !pickingPickup && (
        <TouchableOpacity
          style={s.profileBtn}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Text style={s.profileIcon}>👤</Text>
        </TouchableOpacity>
      )}

      {/* ── Orders history button (right, below profile) ── */}
      {!pickingDest && !pickingPickup && (
        <TouchableOpacity
          style={s.ordersBtn}
          onPress={() => navigation.navigate('OrdersTab')}
        >
          <Text style={s.ordersIcon}>📄</Text>
        </TouchableOpacity>
      )}

      {/* ════════════════════════════════════════
          BOTTOM SHEET
      ════════════════════════════════════════ */}
      {!pickingDest && !pickingPickup && (
        <Animated.View
          style={[s.sheet, { transform: [{ translateY: sheetY }] }]}
        >
          <View style={s.handle} />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >

              {/* ── Address fields ── */}
              <View style={s.addressCard}>

                {/* From */}
                <View style={s.addressRow}>
                  <View style={[s.dot, { backgroundColor: '#10b981' }]} />
                  <View style={s.addressTextWrap}>
                    <Text style={s.addressHint}>ОТКУДА</Text>
                    {locLoading
                      ? <ActivityIndicator size="small" color="#FC3F1D" style={{ marginTop: 4 }} />
                      : <Text style={s.addressVal} numberOfLines={1}>{myAddress}</Text>
                    }
                  </View>
                  <TouchableOpacity onPress={startPickingPickup} style={s.pickBtn}>
                    <Text style={s.pickBtnText}> Выбрать</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.addressDivider} />

                {/* To */}
                <View style={s.addressRow}>
                  <View style={[s.dot, { backgroundColor: '#FC3F1D' }]} />
                  <View style={s.addressTextWrap}>
                    <Text style={s.addressHint}>КУДА</Text>
                    {destAddress
                      ? <Text style={s.addressVal} numberOfLines={1}>{destAddress}</Text>
                      : <Text style={s.addressPlaceholder}>Выберите на карте...</Text>
                    }
                  </View>
                  {destCoords
                    ? (
                      <TouchableOpacity onPress={clearDest}>
                        <Text style={s.clearIcon}>✕</Text>
                      </TouchableOpacity>
                    )
                    : (
                      <TouchableOpacity onPress={startPickingDest} style={s.pickBtn}>
                        <Text style={s.pickBtnText}> Выбрать</Text>
                      </TouchableOpacity>
                    )
                  }
                </View>
              </View>

              {/* ── Transport selector ── */}
              <Text style={s.sectionLabel}>Тип доставки</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.transportScroll}
              >
                {TRANSPORT.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.transportCard, transport.id === t.id && s.transportActive]}
                    onPress={() => setTransport(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.transportIcon}>{t.icon}</Text>
                    <Text style={[s.transportLabel, transport.id === t.id && s.transportLabelActive]}>
                      {t.label}
                    </Text>
                    <Text style={s.transportTime}>{t.time}</Text>
                    <Text style={[s.transportPrice, transport.id === t.id && s.transportPriceActive]}>
                      от ₸{t.base.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ── Comment ── */}
              
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* ═════════════════════
          PRICE + ORDER (FIXED AT BOTTOM)
      ═════════════════════ */}
      {!pickingDest && !pickingPickup && (
      <View style={s.fixedOrderRow}>
        
        {/* Payment Method Button */}
        <TouchableOpacity
          style={s.paymentBtn}
          onPress={() => setShowPayment(true)}
        >
          <Text style={s.paymentIcon}>💳</Text>
          <Text style={s.paymentLabel}>
            {paymentMethod === 'CASH' ? 'Карта' : 'Наличные'}
          </Text>
        </TouchableOpacity>

        {/* Price */}
        <View>
          <Text style={s.priceLabel}>Стоимость</Text>
          <Text style={s.priceValue}>
            {destCoords
              ? `≈ ${price().toLocaleString()} ₸`
              : `от ${transport.base.toLocaleString()} ₸`}
          </Text>
        </View>

        {/* Order Button */}
        <TouchableOpacity
          style={[s.orderBtn, loading && s.orderBtnDisabled]}
          onPress={handleOrder}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.orderBtnText}>Заказать</Text>
          }
        </TouchableOpacity>

      </View>
    )
    }

      {/* ═════════════════════
          PAYMENT METHOD MODAL
      ═════════════════════ */}
      {showPayment && (
        <View style={s.paymentOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowPayment(false)}
            activeOpacity={1}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.paymentModal}
          >
            <View style={s.paymentHandle} />
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: selectingCard ? 250 : 10 }}
            >
              <Text style={s.paymentTitle}>Способ оплаты</Text>

            {/* Cash Option */}
            <TouchableOpacity
              style={[s.paymentOption, paymentMethod === 'CASH' && !selectingCard && s.paymentOptionActive]}
              onPress={() => {
                setPaymentMethod('CASH')
                setSelectingCard(false)
              }}
            >
              <Text style={s.paymentOptionIcon}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.paymentOptionText, paymentMethod === 'CASH' && !selectingCard && s.paymentOptionTextActive]}>Наличные</Text>
                <Text style={s.paymentOptionSubtext}>Оплата при доставке</Text>
              </View>
              <View style={[s.paymentRadio, paymentMethod === 'CASH' && !selectingCard && s.paymentRadioActive]}>
                {paymentMethod === 'CASH' && !selectingCard && <View style={s.paymentRadioDot} />}
              </View>
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity
              style={[s.paymentOption, (paymentMethod === 'CARD' || selectingCard) && s.paymentOptionActive]}
              onPress={() => {
                setSelectingCard(true)
              }}
            >
              <Text style={s.paymentOptionIcon}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.paymentOptionText, (paymentMethod === 'CARD' || selectingCard) && s.paymentOptionTextActive]}>Банковская карта</Text>
                <Text style={s.paymentOptionSubtext}>Безопасная онлайн оплата</Text>
              </View>
              <View style={[s.paymentRadio, (paymentMethod === 'CARD' || selectingCard) && s.paymentRadioActive]}>
                {(paymentMethod === 'CARD' || selectingCard) && <View style={s.paymentRadioDot} />}
              </View>
            </TouchableOpacity>

            {/* Card Form - shown when card option is tapped */}
            {selectingCard && (
              <View style={s.cardFormWrapper}>
                <Text style={s.cardFormTitle}>Данные карты</Text>

                <TextInput
                  style={s.cardInput}
                  placeholder="Номер карты"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(val) => {
                    let formatted = val.replace(/\s/g, '')
                    if (formatted.length > 16) formatted = formatted.slice(0, 16)
                    const parts = formatted.match(/.{1,4}/g) || []
                    setCardNumber(parts.join(' '))
                  }}
                />

                <View style={s.cardRowInputs}>
                  <TextInput
                    style={[s.cardInput, { flex: 1 }]}
                    placeholder="MM/YY"
                    placeholderTextColor="#bbb"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={cardExpiry}
                    onChangeText={(val) => {
                      let clean = val.replace(/\D/g, '')
                      if (clean.length >= 2) {
                        clean = clean.slice(0, 2) + '/' + clean.slice(2, 4)
                      }
                      setCardExpiry(clean)
                    }}
                  />
                  <TextInput
                    style={[s.cardInput, { flex: 1, marginLeft: 10 }]}
                    placeholder="CVV"
                    placeholderTextColor="#bbb"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    value={cardCVV}
                    onChangeText={setCardCVV}
                  />
                </View>
              </View>
            )}

              <View style={{ height: 12 }} />
            </ScrollView>

            {/* Done Button - Fixed at bottom */}
            <TouchableOpacity
              style={s.paymentDoneBtn}
              onPress={() => {
                if (selectingCard) {
                  // Validate card if entering card form
                  if (cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length === 5 && cardCVV.length >= 3) {
                    setPaymentMethod('CARD')
                    setShowPayment(false)
                    setSelectingCard(false)
                  } else {
                    Alert.alert('Ошибка', 'Пожалуйста, заполните все поля корректно')
                  }
                } else {
                  // Close modal with selected payment method (Cash or Card)
                  setShowPayment(false)
                }
              }}
            >
              <Text style={s.paymentDoneBtnText}>Готово ✓</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Picking overlay
  pickingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-start', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
  },
  pickingBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 12, maxWidth: '80%',
  },
  pickingText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  cancelPick: {
    position: 'absolute',
    bottom: 40, alignSelf: 'center',
    backgroundColor: '#fff', borderRadius: 24,
    paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  cancelPickText: { fontSize: 15, fontWeight: '700', color: '#FC3F1D' },

  // ── My location button
  myLocBtn: {
    position: 'absolute',
    right: 16,
    bottom: 310,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  myLocIcon: { fontSize: 22 },

  // ── Profile button (top right)
  profileBtn: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 54 : 44,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  profileIcon: { fontSize: 22 },

  // ── Orders button (right, below profile)
  ordersBtn: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 110 : 100,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  ordersIcon: { fontSize: 22 },

  // ── Markers
  markerA: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#10b981',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  markerB: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FC3F1D',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  markerLetter: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── Bottom sheet
  sheet: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    maxHeight: SCREEN_H * 0.55,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 14,
    flexDirection: 'column',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 14,
  },

  // ── Address card
  addressCard: {
    backgroundColor: '#f9f9f9', borderRadius: 16,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#efefef',
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  addressTextWrap: { flex: 1 },
  addressHint: { fontSize: 10, fontWeight: '700', color: '#bbb', letterSpacing: 0.5 },
  addressVal: { fontSize: 14, fontWeight: '600', color: '#0d0d0d', marginTop: 2 },
  addressPlaceholder: { fontSize: 14, color: '#bbb', marginTop: 2 },
  addressDivider: { height: 1, backgroundColor: '#efefef', marginVertical: 10, marginLeft: 20 },
  locIcon: { fontSize: 20 },
  clearIcon: { fontSize: 16, color: '#aaa', fontWeight: '700', padding: 4 },
  pickBtn: {
    backgroundColor: '#fff5f3', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FC3F1D',
  },
  pickBtnText: { fontSize: 12, fontWeight: '700', color: '#FC3F1D' },

  // ── Transport
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10,
  },
  transportScroll: { marginBottom: 16 },
  transportCard: {
    width: 96, borderRadius: 16, padding: 12, marginRight: 10,
    backgroundColor: '#f5f5f5', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  transportActive: { borderColor: '#FC3F1D', backgroundColor: '#fff5f3' },
  transportIcon: { fontSize: 26, marginBottom: 4 },
  transportLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  transportLabelActive: { color: '#FC3F1D' },
  transportTime: { fontSize: 10, color: '#aaa', marginTop: 2 },
  transportPrice: { fontSize: 11, fontWeight: '700', color: '#555', marginTop: 4 },
  transportPriceActive: { color: '#FC3F1D' },

  // ── Comment
  commentInput: {
    borderWidth: 1, borderColor: '#efefef', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#0d0d0d',
    backgroundColor: '#fafafa', minHeight: 60,
    textAlignVertical: 'top', marginBottom: 16,
  },

  // ── Order row
  // ── Fixed order row (always visible)
  fixedOrderRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#efefef',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  priceLabel: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  priceValue: { fontSize: 22, fontWeight: '800', color: '#0d0d0d', marginTop: 2 },
  orderBtn: {
    backgroundColor: '#FC3F1D', borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 16,
    shadowColor: '#FC3F1D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // ?? Payment
  paymentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f5f5f5', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  paymentIcon: { fontSize: 18 },
  paymentLabel: { fontSize: 12, fontWeight: '700', color: '#555' },

  paymentOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  paymentModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    maxHeight: SCREEN_H * 0.75,
    flexDirection: 'column',
    flex: 1,
  },
  paymentHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18, fontWeight: '800', color: '#0d0d0d', marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginBottom: 10, borderRadius: 14,
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#efefef',
  },
  paymentOptionActive: {
    backgroundColor: '#fff5f3', borderColor: '#FC3F1D',
  },
  paymentOptionIcon: { fontSize: 24 },
  paymentOptionText: { fontSize: 14, fontWeight: '700', color: '#555' },
  paymentOptionTextActive: { color: '#FC3F1D' },
  paymentOptionSubtext: { fontSize: 12, color: '#aaa', marginTop: 2 },
  paymentRadio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#ddd',
    justifyContent: 'center', alignItems: 'center',
  },
  paymentRadioActive: { borderColor: '#FC3F1D' },
  paymentRadioDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#FC3F1D',
  },

  // ── Card Form
  cardFormWrapper: {
    backgroundColor: '#f9f9f9', borderRadius: 14,
    padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#efefef',
  },
  cardFormTitle: { fontSize: 14, fontWeight: '800', color: '#0d0d0d', marginBottom: 12 },
  cardInput: {
    borderWidth: 1, borderColor: '#efefef', borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: '#0d0d0d', marginBottom: 10,
  },
  cardRowInputs: { flexDirection: 'row', marginBottom: 0 },
  paymentDoneBtn: {
    backgroundColor: '#FC3F1D', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#FC3F1D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  paymentDoneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
