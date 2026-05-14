import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Location from 'expo-location'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UserParcelCreateScreen } from './UserParcelCreateScreen'

const { height: SCREEN_H } = Dimensions.get('window')

const ICONS = {
  courier: require('../../../assets/parcel/courier.png'),
  express: require('../../../assets/parcel/express.png'),
}

const TRANSPORT = [
  { id: 'STANDARD' as const, label: 'Courier', time: '~30 min', base: 800 },
  { id: 'EXPRESS' as const, label: 'Express', time: '~15 min', base: 1500 },
  { id: 'SCHEDULED' as const, label: 'Scheduled', time: 'Choose time', base: 1200 },
]

const ALMATY_CENTER = {
  latitude: 43.238949,
  longitude: 76.889709,
}

type Step = 'map' | 'form'

type TransportId = (typeof TRANSPORT)[number]['id']

type UserParcelFlowScreenProps = {
  accessToken?: string
  onBackPress?: () => void
  onOrdersPress?: () => void
  onCreated?: (orderId?: string) => void
}

type ParcelDraft = {
  pickupAddress: string
  deliveryAddress: string
  comment: string
  serviceType: TransportId
  pickupCoordinates: { latitude: number; longitude: number } | null
  deliveryCoordinates: { latitude: number; longitude: number } | null
}

function isValidCoordinateNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getTransportMeta(id: TransportId) {
  switch (id) {
    case 'EXPRESS':
      return { label: 'Express', time: '5-10 min', price: 1200 }
    case 'SCHEDULED':
      return { label: 'Schedule', time: 'Choose time', price: 600 }
    default:
      return { label: 'Courier', time: '15-20 min', price: 800 }
  }
}

const HeaderOrdersIcon = () => (
  <View style={styles.ordersGlyph}>
    <View style={styles.ordersGlyphClip} />
    <View style={styles.ordersGlyphLine} />
    <View style={styles.ordersGlyphLine} />
    <View style={[styles.ordersGlyphLine, styles.ordersGlyphShortLine]} />
  </View>
)

const PaymentCardIcon = () => (
  <View style={styles.cardGlyph}>
    <View style={styles.cardGlyphStripe} />
    <View style={styles.cardGlyphLine} />
  </View>
)

const ChevronIcon = () => (
  <View style={styles.chevronGlyph}>
    <View style={styles.chevronGlyphLineA} />
    <View style={styles.chevronGlyphLineB} />
  </View>
)

function TransportSymbol({ type, active }: { type: TransportId; active: boolean }) {
  if (type === 'STANDARD') {
    return (
      <Image
        source={ICONS.courier}
        style={[styles.transportAssetIcon, active && styles.transportAssetIconActive]}
        resizeMode="contain"
      />
    )
  }

  if (type === 'EXPRESS') {
    return (
      <Image
        source={ICONS.express}
        style={[styles.transportAssetIcon, active && styles.transportAssetIconActive]}
        resizeMode="contain"
      />
    )
  }

  return (
    <View style={styles.calendarGlyph}>
      <View style={[styles.calendarTop, active && styles.grayIconActive]} />
      <View style={[styles.calendarBody, active && styles.grayIconActive]} />
      <View style={[styles.calendarDot, active && styles.grayIconActive]} />
    </View>
  )
}

async function reverseGeocodeAddress(
  coords: { latitude: number; longitude: number },
  fallbackLabel: string,
) {
  try {
    const results = await Location.reverseGeocodeAsync(coords)
    const firstResult = results[0]
    if (!firstResult) {
      return fallbackLabel
    }

    const street = [firstResult.street, firstResult.streetNumber].filter(Boolean).join(' ').trim()
    return street || firstResult.city || fallbackLabel
  } catch {
    return fallbackLabel
  }
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
          return {
            longitude,
            latitude,
          }
        })
        .filter(
          point =>
            isValidCoordinateNumber(point.latitude) &&
            isValidCoordinateNumber(point.longitude),
        )

      if (coords.length > 1) {
        return coords
      }
    }
  } catch {
    // Fallback to a straight line when the route service is unavailable.
  }

  return [origin, destination]
}

export function UserParcelFlowScreen({
  accessToken,
  onBackPress,
  onOrdersPress,
  onCreated,
}: UserParcelFlowScreenProps) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView | null>(null)
  const sheetY = useRef(new Animated.Value(400)).current

  const [step, setStep] = useState<Step>('map')
  const [myCoords, setMyCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [myAddress, setMyAddress] = useState('Detecting your location...')
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [destAddress, setDestAddress] = useState('')
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([])
  const [pickingDest, setPickingDest] = useState(false)
  const [pickingPickup, setPickingPickup] = useState(false)
  const [transport, setTransport] = useState(TRANSPORT[0])
  const [comment] = useState('')
  const [loading] = useState(false)
  const [locLoading, setLocLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
  const [showPayment, setShowPayment] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVV, setCardCVV] = useState('')
  const [selectingCard, setSelectingCard] = useState(false)
  const [draft, setDraft] = useState<ParcelDraft | null>(null)

  const showSheet = () =>
    Animated.spring(sheetY, {
      toValue: 0,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start()

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (!isMounted) {
          return
        }

        if (status !== 'granted') {
          setMyCoords(ALMATY_CENTER)
          setMyAddress('Location access denied')
          setLocLoading(false)
          showSheet()
          return
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })

        if (!isMounted) {
          return
        }

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }

        setMyCoords(coords)
        centerMap(coords, 0.012)
        setMyAddress(await reverseGeocodeAddress(coords, 'Current location'))
      } catch {
        if (isMounted) {
          setMyCoords(ALMATY_CENTER)
          setMyAddress('Unable to detect location')
        }
      } finally {
        if (isMounted) {
          setLocLoading(false)
          showSheet()
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const buildRoute = async () => {
      const nextRoute = await fetchRouteCoordinates(myCoords, destCoords)
      if (isMounted) {
        setRouteCoords(nextRoute)
      }
    }

    if (myCoords && destCoords) {
      void buildRoute()
    } else {
      setRouteCoords([])
    }

    return () => {
      isMounted = false
    }
  }, [destCoords, myCoords])

  const centerMap = (coords: { latitude: number; longitude: number }, delta = 0.012) => {
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: delta, longitudeDelta: delta },
      700,
    )
  }

  const handleMapPress = async (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } }
  }) => {
    const coords = event.nativeEvent.coordinate

    if (pickingPickup) {
      setMyCoords(coords)
      setMyAddress(await reverseGeocodeAddress(coords, 'Pickup point'))
      setPickingPickup(false)
      centerMap(coords, 0.012)
      return
    }

    if (pickingDest) {
      setDestCoords(coords)
      setDestAddress(await reverseGeocodeAddress(coords, 'Destination point'))
      setPickingDest(false)

      if (myCoords) {
        mapRef.current?.fitToCoordinates([myCoords, coords], {
          edgePadding: { top: insets.top + 60, right: 60, bottom: 320, left: 60 },
          animated: true,
        })
      }
    }
  }

  const startPickingPickup = () => {
    setPickingDest(false)
    setPickingPickup(true)
    if (myCoords) {
      centerMap(myCoords, 0.03)
    }
  }

  const startPickingDest = () => {
    setPickingPickup(false)
    setPickingDest(true)
    if (myCoords) {
      centerMap(myCoords, 0.03)
    }
  }

  const clearDest = () => {
    setDestCoords(null)
    setDestAddress('')
    if (myCoords) {
      centerMap(myCoords, 0.012)
    }
  }

  const cancelPicking = () => {
    setPickingDest(false)
    setPickingPickup(false)

    if (myCoords && destCoords) {
      mapRef.current?.fitToCoordinates([myCoords, destCoords], {
        edgePadding: { top: insets.top + 60, right: 60, bottom: 320, left: 60 },
        animated: true,
      })
      return
    }

    if (myCoords) {
      centerMap(myCoords, 0.012)
    }
  }

  const handleOrder = () => {
    if (!myAddress.trim()) {
      Alert.alert('Pickup required', 'Choose the pickup point first.')
      return
    }

    setDraft({
      pickupAddress: myAddress,
      deliveryAddress: destAddress,
      comment,
      serviceType: transport.id,
      pickupCoordinates: myCoords,
      deliveryCoordinates: destCoords,
    })
    setStep('form')
  }

  if (step === 'form' && draft) {
    return (
      <UserParcelCreateScreen
        accessToken={accessToken}
        initialPickupAddress={draft.pickupAddress}
        initialDeliveryAddress={draft.deliveryAddress}
        initialComment={draft.comment}
        initialServiceType={draft.serviceType}
        initialPickupCoordinates={draft.pickupCoordinates}
        initialDeliveryCoordinates={draft.deliveryCoordinates}
        onBackPress={() => setStep('map')}
        onCreated={onCreated}
      />
    )
  }

  const selectedTransportMeta = getTransportMeta(transport.id)

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          ...ALMATY_CENTER,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
        showsUserLocation={Boolean(myCoords)}
        showsMyLocationButton={false}
        showsTraffic={false}
        pitchEnabled={false}
      >
        {myCoords ? (
          <Marker coordinate={myCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerA}>
              <Text style={styles.markerLetter}>A</Text>
            </View>
          </Marker>
        ) : null}

        {destCoords ? (
          <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerB}>
              <Text style={styles.markerLetter}>B</Text>
            </View>
          </Marker>
        ) : null}

        {routeCoords.length > 0 ? (
          <Polyline coordinates={routeCoords} strokeColor="#FC3F1D" strokeWidth={4} />
        ) : null}
      </MapView>

      {pickingDest ? (
        <View style={[styles.pickingOverlay, { paddingTop: insets.top + 44 }]} pointerEvents="none">
          <View style={styles.pickingBadge}>
            <Text style={styles.pickingText}>Tap on the map to choose the destination point</Text>
          </View>
        </View>
      ) : null}

      {pickingPickup ? (
        <View style={[styles.pickingOverlay, { paddingTop: insets.top + 44 }]} pointerEvents="none">
          <View style={styles.pickingBadge}>
            <Text style={styles.pickingText}>Tap on the map to choose the pickup point</Text>
          </View>
        </View>
      ) : null}

      {pickingDest || pickingPickup ? (
        <TouchableOpacity
          style={[styles.cancelPick, { bottom: Math.max(40, insets.bottom + 18) }]}
          onPress={cancelPicking}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelPickText}>Cancel</Text>
        </TouchableOpacity>
      ) : null}

      {!pickingDest && !pickingPickup ? (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={onBackPress}
          activeOpacity={0.88}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
      ) : null}

      {!pickingDest && !pickingPickup && onOrdersPress ? (
        <TouchableOpacity
          style={[styles.ordersBtn, { top: insets.top + 8 }]}
          onPress={onOrdersPress}
          activeOpacity={0.88}
        >
          <HeaderOrdersIcon />
        </TouchableOpacity>
      ) : null}

      {!pickingDest && !pickingPickup ? (
        <Animated.View
          style={[
            styles.sheet,
            {
              bottom: 88 + Math.max(insets.bottom, 0),
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.newSheetContent}>
                <View style={styles.routeCard}>
                  <View style={styles.routeConnector} />

                  <View style={styles.routeRowNew}>
                    <View style={styles.fromPinOuter}>
                      <View style={styles.fromPinInner} />
                    </View>

                    <View style={styles.routeTextWrapNew}>
                      <Text style={styles.routeLabelNew}>From</Text>
                      {locLoading ? (
                        <ActivityIndicator size="small" color="#FF7A59" style={styles.routeLoader} />
                      ) : (
                        <Text style={styles.routeValueNew} numberOfLines={1}>
                          {myAddress || 'Almaty'}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity onPress={startPickingPickup} style={styles.changeButton} activeOpacity={0.85}>
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.routeDividerNew} />

                  <View style={styles.routeRowNew}>
                    <View style={styles.toPinOuter}>
                      <View style={styles.toPinDot} />
                    </View>

                    <TouchableOpacity
                      onPress={startPickingDest}
                      activeOpacity={0.85}
                      style={styles.routeTextWrapNew}
                    >
                      <Text style={styles.routeLabelNew}>To</Text>
                      <Text
                        style={[styles.routeValueNew, !destAddress && styles.routePlaceholderNew]}
                        numberOfLines={1}
                      >
                        {destAddress || 'Where to?'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={destCoords ? clearDest : startPickingDest}
                      style={styles.plusButton}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.plusButtonText}>{destCoords ? 'x' : '+'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.deliveryHeaderWrap}>
                  <Text style={styles.deliveryHeaderText}>Delivery Type</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.deliveryTypeScroll}
                  contentContainerStyle={styles.deliveryTypeScrollContent}
                >
                  {TRANSPORT.map(item => {
                    const meta = getTransportMeta(item.id)
                    const isActive = transport.id === item.id

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.deliveryTypeCard, isActive && styles.deliveryTypeCardActive]}
                        onPress={() => setTransport(item)}
                        activeOpacity={0.88}
                      >
                        {isActive ? <View style={styles.deliveryTypeGlow} /> : null}

                        <TransportSymbol type={item.id} active={isActive} />

                        <View style={styles.deliveryTypeTextBlock}>
                          <Text style={styles.deliveryTypeTitle}>{meta.label}</Text>
                          <Text style={styles.deliveryTypeTime}>{meta.time}</Text>
                        </View>

                        <Text style={[styles.deliveryTypePrice, isActive && styles.deliveryTypePriceActive]}>
                          from ₸{meta.price.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.cardPaymentRow}
                  onPress={() => setShowPayment(true)}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardPaymentLeft}>
                    <View style={styles.cardIconBubble}>
                      <PaymentCardIcon />
                    </View>

                    <View>
                      <Text style={styles.cardPaymentTitle}>Card</Text>
                      <Text style={styles.cardPaymentSubtitle}>
                        {paymentMethod === 'CARD' ? 'Selected card' : '**** 4242'}
                      </Text>
                    </View>
                  </View>

                  <ChevronIcon />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      {!pickingDest && !pickingPickup ? (
          <View
            style={[
              styles.estimateFooter,
              {
                paddingBottom: Math.max(20, insets.bottom + 10),
              },
            ]}
          >
            <View>
              <Text style={styles.estimateLabel}>Total estimated</Text>
              <Text style={styles.estimateValue}>from ₸{selectedTransportMeta.price.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.newOrderBtn, loading && styles.orderBtnDisabled]}
              onPress={handleOrder}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.newOrderBtnText}>Order</Text>}
            </TouchableOpacity>
          </View>
      ) : null}

      {showPayment ? (
        <View style={styles.paymentOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowPayment(false)}
            activeOpacity={1}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.paymentModal}
          >
            <View style={styles.paymentHandleWrap}>
              <View style={styles.paymentHandle} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.paymentScrollContent,
                { paddingBottom: Math.max(24, insets.bottom + 12) },
              ]}
            >
              <Text style={styles.paymentTitle}>Payment method</Text>

              <View style={styles.paymentOptionsWrap}>
                <TouchableOpacity
                  style={[
                    styles.paymentOptionNew,
                    paymentMethod === 'CASH' && !selectingCard && styles.paymentOptionNewActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod('CASH')
                    setSelectingCard(false)
                  }}
                  activeOpacity={0.88}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View
                      style={[
                        styles.paymentIconBubbleNew,
                        paymentMethod === 'CASH' && !selectingCard && styles.paymentIconBubbleActive,
                      ]}
                    >
                      <Text style={styles.paymentOptionIconNew}>$</Text>
                    </View>

                    <View>
                      <Text style={styles.paymentOptionTitleNew}>Cash</Text>
                      <Text style={styles.paymentOptionSubtitleNew}>Pay on delivery</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.paymentRadioNew,
                      paymentMethod === 'CASH' && !selectingCard && styles.paymentRadioNewActive,
                    ]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionNew,
                    (paymentMethod === 'CARD' || selectingCard) && styles.paymentOptionNewActive,
                  ]}
                  onPress={() => {
                    setSelectingCard(true)
                  }}
                  activeOpacity={0.88}
                >
                  <View style={styles.paymentOptionLeft}>
                    <View
                      style={[
                        styles.paymentIconBubbleNew,
                        (paymentMethod === 'CARD' || selectingCard) && styles.paymentIconBubbleActive,
                      ]}
                    >
                      <Text style={styles.paymentOptionIconNew}>#</Text>
                    </View>

                    <View>
                      <Text style={styles.paymentOptionTitleNew}>Bank card</Text>
                      <Text style={styles.paymentOptionSubtitleNew}>Secure online payment</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.paymentRadioNew,
                      (paymentMethod === 'CARD' || selectingCard) && styles.paymentRadioNewActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {selectingCard ? (
                <View style={styles.cardFormWrapperNew}>
                  <Text style={styles.cardFormTitleNew}>Card details</Text>

                  <TextInput
                    style={styles.cardInputNew}
                    placeholder="Card number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={val => {
                      let formatted = val.replace(/\s/g, '')
                      if (formatted.length > 16) {
                        formatted = formatted.slice(0, 16)
                      }
                      const parts = formatted.match(/.{1,4}/g) || []
                      setCardNumber(parts.join(' '))
                    }}
                  />

                  <View style={styles.cardRowInputsNew}>
                    <TextInput
                      style={[styles.cardInputNew, styles.cardInputHalfNew]}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={5}
                      value={cardExpiry}
                      onChangeText={val => {
                        let clean = val.replace(/\D/g, '')
                        if (clean.length >= 2) {
                          clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`
                        }
                        setCardExpiry(clean)
                      }}
                    />

                    <View style={styles.cvvInputWrap}>
                      <TextInput
                        style={[styles.cardInputNew, styles.cardInputHalfNew, styles.cvvInput]}
                        placeholder="CVV"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={cardCVV}
                        onChangeText={setCardCVV}
                        secureTextEntry
                      />
                      <Text style={styles.cvvIcon}>?</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.paymentFooterNew, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
              <TouchableOpacity
                style={styles.paymentDoneBtnNew}
                onPress={() => {
                  if (selectingCard) {
                    setPaymentMethod('CARD')
                  }
                  setShowPayment(false)
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.paymentDoneBtnTextNew}>Done</Text>
                <Text style={styles.paymentDoneCheck}>✓</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pickingBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  pickingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelPick: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelPickText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FC3F1D',
  },
  backBtn: {
    position: 'absolute',
    left: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  backBtnText: {
    fontSize: 34,
    lineHeight: 34,
    color: '#18181B',
    fontWeight: '400',
    marginTop: -2,
  },
  ordersBtn: {
    position: 'absolute',
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  ordersGlyph: {
    width: 18,
    height: 20,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#18181B',
    paddingTop: 5,
    paddingHorizontal: 3,
  },
  ordersGlyphClip: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    width: 8,
    height: 5,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  ordersGlyphLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#18181B',
    marginBottom: 3,
  },
  ordersGlyphShortLine: {
    width: 6,
  },
  markerA: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerB: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FC3F1D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    maxHeight: SCREEN_H * 0.66,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 14,
    flexDirection: 'column',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 16,
  },
  newSheetContent: {
    gap: 22,
    paddingBottom: 16,
  },
  routeCard: {
    position: 'relative',
    minHeight: 132,
    borderRadius: 24,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  routeConnector: {
    position: 'absolute',
    left: 30,
    top: 42,
    width: 2,
    height: 54,
    backgroundColor: '#E4E4E7',
  },
  routeRowNew: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
  },
  routeDividerNew: {
    height: 1,
    backgroundColor: 'rgba(228,228,231,0.65)',
    marginLeft: 48,
    marginVertical: 4,
  },
  fromPinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FF7A59',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF7A59',
  },
  toPinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toPinDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#71717A',
  },
  routeTextWrapNew: {
    flex: 1,
    minWidth: 0,
  },
  routeLabelNew: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  routeValueNew: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  routePlaceholderNew: {
    color: '#71717A',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  routeLoader: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#FF7A59',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  plusButtonText: {
    color: '#18181B',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400',
  },
  deliveryHeaderWrap: {
    marginTop: -2,
  },
  deliveryHeaderText: {
    color: '#18181B',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  deliveryTypeScroll: {
    marginHorizontal: -18,
  },
  deliveryTypeScrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  deliveryTypeCard: {
    width: 120,
    height: 146,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  deliveryTypeCardActive: {
    borderWidth: 2,
    borderColor: '#FF7A59',
    backgroundColor: 'rgba(255,122,89,0.05)',
  },
  deliveryTypeGlow: {
    position: 'absolute',
    right: -8,
    top: -10,
    width: 74,
    height: 74,
    borderBottomLeftRadius: 74,
    backgroundColor: 'rgba(255,122,89,0.08)',
  },
  deliveryTypeTextBlock: {
    gap: 3,
  },
  deliveryTypeTitle: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  deliveryTypeTime: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  deliveryTypePrice: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  deliveryTypePriceActive: {
    color: '#FF7A59',
  },
  transportAssetIcon: {
    width: 30,
    height: 30,
  },
  transportAssetIconActive: {
    opacity: 1,
  },
  cardPaymentRow: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,91,186,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPaymentTitle: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  cardPaymentSubtitle: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  cardGlyph: {
    width: 18,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#1E5BBA',
  },
  cardGlyphStripe: {
    height: 2,
    backgroundColor: '#1E5BBA',
    marginTop: 3,
  },
  cardGlyphLine: {
    width: 6,
    height: 2,
    backgroundColor: '#1E5BBA',
    marginTop: 3,
    marginLeft: 3,
  },
  chevronGlyph: {
    width: 12,
    height: 12,
    justifyContent: 'center',
  },
  chevronGlyphLineA: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#71717A',
    transform: [{ rotate: '45deg' }],
    marginBottom: 3,
  },
  chevronGlyphLineB: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#71717A',
    transform: [{ rotate: '-45deg' }],
    marginTop: 1,
  },
  calendarGlyph: {
    width: 24,
    height: 25,
    position: 'relative',
  },
  calendarTop: {
    position: 'absolute',
    left: 2,
    top: 1,
    width: 20,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#71717A',
  },
  calendarBody: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 20,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#71717A',
  },
  calendarDot: {
    position: 'absolute',
    right: 4,
    bottom: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#71717A',
  },
  grayIconActive: {
    backgroundColor: '#71717A',
    borderColor: '#71717A',
  },
  estimateFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 96,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(228,228,231,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 10,
  },
  estimateLabel: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  estimateValue: {
    color: '#18181B',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  newOrderBtn: {
    width: 120,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF7A59',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 8,
  },
  newOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  orderBtnDisabled: {
    opacity: 0.6,
  },
  paymentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  paymentModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.82,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 18,
  },
  paymentHandleWrap: {
    alignSelf: 'stretch',
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  paymentHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  paymentScrollContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  paymentTitle: {
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  paymentOptionsWrap: {
    gap: 12,
  },
  paymentOptionNew: {
    minHeight: 74,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionNewActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,122,89,0.20)',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  paymentIconBubbleNew: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentIconBubbleActive: {
    backgroundColor: 'rgba(255,122,89,0.10)',
  },
  paymentOptionIconNew: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  paymentOptionTitleNew: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
  },
  paymentOptionSubtitleNew: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    marginTop: 2,
  },
  paymentRadioNew: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  paymentRadioNewActive: {
    borderWidth: 5,
    borderColor: '#FF7A59',
    backgroundColor: '#FFFFFF',
  },
  cardFormWrapperNew: {
    paddingTop: 7,
    gap: 16,
  },
  cardFormTitleNew: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '700',
  },
  cardInputNew: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '400',
  },
  cardRowInputsNew: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInputHalfNew: {
    flex: 1,
  },
  cvvInputWrap: {
    flex: 1,
    position: 'relative',
  },
  cvvInput: {
    paddingRight: 40,
  },
  cvvIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentFooterNew: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentDoneBtnNew: {
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: '#FF7A59',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  paymentDoneBtnTextNew: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  paymentDoneCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
})
