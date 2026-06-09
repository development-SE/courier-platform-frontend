import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { useEffect, useRef, useState, useMemo } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParcelOrder } from '../../data/ordersApi'
import { UserParcelAddressDetailsModal, type AddressDetails } from './UserParcelAddressDetailsModal'
import { ParcelAddressSearchModal } from './ParcelAddressSearchModal'
import { googleGeocode } from '../../data/googleMapsApi'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const ICONS = {
  courier: require('../../../assets/parcel/courier.png'),
  express: require('../../../assets/parcel/express.png'),
  scheduled: require('../../../assets/parcel/scheduled.png'),
  from: require('../../../assets/parcel/from.png'),
  to: require('../../../assets/parcel/to.png'),
  sender: require('../../../assets/parcel/sender.png'),
  receiver: require('../../../assets/parcel/reciever.png'),
  small: require('../../../assets/parcel/small.png'),
  medium: require('../../../assets/parcel/medium.png'),
  box: require('../../../assets/parcel/box.png'),
}

type DeliveryTypeId = 'STANDARD' | 'EXPRESS' | 'SCHEDULED'

type UserParcelCreateScreenProps = {
  accessToken?: string
  initialPickupAddress?: string
  initialDeliveryAddress?: string
  initialComment?: string
  initialServiceType?: DeliveryTypeId
  initialPickupCoordinates?: { latitude: number; longitude: number } | null
  initialDeliveryCoordinates?: { latitude: number; longitude: number } | null
  onBackPress?: () => void
  onCreated?: (orderId?: string) => void
}


const TRANSPORT_TYPES = [
  {
    id: 'STANDARD' as const,
    icon: ICONS.courier,
    label: 'Courier',
    desc: '',
    basePrice: 500,
  },
  {
    id: 'EXPRESS' as const,
    icon: ICONS.express,
    label: 'Express',
    desc: 'FAST',
    basePrice: 800,
  },
  {
    id: 'SCHEDULED' as const,
    icon: ICONS.scheduled,
    label: 'Scheduled',
    desc: '',
    basePrice: 400,
  },
]

const DATE_SLOTS = ['Today', 'Tomorrow', 'Wed, 10.06', 'Thu, 11.06', 'Fri, 12.06', 'Sat, 13.06']
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

const PARCEL_SIZES = [
  {
    id: 'SMALL' as const,
    icon: ICONS.small,
    title: 'Small',
    desc: 'Documents, keys, small envelopes',
  },
  {
    id: 'MEDIUM' as const,
    icon: ICONS.medium,
    title: 'Medium',
    desc: 'Shoebox, clothing, small electronics',
  },
  {
    id: 'LARGE' as const,
    icon: ICONS.box,
    title: 'Large',
    desc: 'Big boxes, appliances, heavy packages',
  },
]

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function UserParcelCreateScreen({
  accessToken,
  initialPickupAddress = '',
  initialDeliveryAddress = '',
  initialComment = '',
  initialServiceType = 'STANDARD',
  initialPickupCoordinates = null,
  initialDeliveryCoordinates = null,
  onBackPress,
  onCreated,
}: UserParcelCreateScreenProps) {
  const insets = useSafeAreaInsets()
  const [pickupAddress, setPickupAddress] = useState(initialPickupAddress)
  const [destAddress, setDestAddress] = useState(initialDeliveryAddress)
  const [pickupContactName, setPickupContactName] = useState('')
  const [pickupContactPhone, setPickupContactPhone] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDesc, setPackageDesc] = useState('')
  const [notes, setNotes] = useState(initialComment)
  const [transport, setTransport] = useState(
    TRANSPORT_TYPES.find(item => item.id === initialServiceType) ?? TRANSPORT_TYPES[1],
  )
  const [parcelSize, setParcelSize] = useState(PARCEL_SIZES[0])
  const [loading, setLoading] = useState(false)
  const [doorToDoor, setDoorToDoor] = useState(true)

  const [activeAddressModal, setActiveAddressModal] = useState<'from' | 'to' | null>(null)
  const [fromAddressDetails, setFromAddressDetails] = useState<AddressDetails>({
    street: '',
    city: 'Almaty',
    entrance: '',
    apt: '',
    floor: '',
    doorCode: '',
    phone: '',
    courierInstructions: '',
  })
  const [toAddressDetails, setToAddressDetails] = useState<AddressDetails>({
    street: '',
    city: 'Almaty',
    entrance: '',
    apt: '',
    floor: '',
    doorCode: '',
    phone: '',
    courierInstructions: '',
  })

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('Today')
  const [selectedTime, setSelectedTime] = useState('12:00')
  const [tempDate, setTempDate] = useState('Today')
  const [tempTime, setTempTime] = useState('12:00')

  const [pickupSearchVisible, setPickupSearchVisible] = useState(false)
  const [pickupSearchMode, setPickupSearchMode] = useState<'search' | 'map'>('search')
  const [destSearchVisible, setDestSearchVisible] = useState(false)
  const [destSearchMode, setDestSearchMode] = useState<'search' | 'map'>('search')
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(
    initialPickupCoordinates,
  )
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(
    initialDeliveryCoordinates,
  )

  const distanceKm = useMemo(() => {
    if (!pickupCoords || !deliveryCoords) return 0
    const rawMeters = calculateHaversineDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude,
    )
    return (rawMeters * 1.25) / 1000 // estimate road distance
  }, [pickupCoords, deliveryCoords])

  const totalPrice = useMemo(() => {
    const base = transport.basePrice
    const distanceCost = Math.round(distanceKm * 150)
    let sizeSurcharge = 0
    if (parcelSize.id === 'MEDIUM') sizeSurcharge = 300
    else if (parcelSize.id === 'LARGE') sizeSurcharge = 600
    const doorSurcharge = doorToDoor ? 200 : 0
    const fee = 150 // fixed service fee
    return Math.round(base + distanceCost + sizeSurcharge + doorSurcharge + fee)
  }, [transport.basePrice, distanceKm, parcelSize.id, doorToDoor])

  const contentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start()
  }, [contentAnim])

  useEffect(() => {
    setFromAddressDetails(prev => ({
      ...prev,
      street: pickupAddress,
    }))
  }, [pickupAddress])

  useEffect(() => {
    setToAddressDetails(prev => ({
      ...prev,
      street: destAddress,
    }))
  }, [destAddress])

  const openScheduleModal = () => {
    setTempDate(selectedDate)
    setTempTime(selectedTime)
    setShowScheduleModal(true)
  }

  const confirmSchedule = () => {
    setSelectedDate(tempDate)
    setSelectedTime(tempTime)
    setTransport(TRANSPORT_TYPES.find(t => t.id === 'SCHEDULED')!)
    setShowScheduleModal(false)
  }

  const estimatedPrice = () => totalPrice

  const geocodeOrderAddress = async (street: string) => {
    const normalizedStreet = street.trim()
    if (!normalizedStreet) {
      return null
    }

    const queries = [
      `${normalizedStreet}, Almaty, Kazakhstan`,
      `${normalizedStreet}, Kazakhstan`,
      normalizedStreet,
    ]

    for (const query of queries) {
      try {
        const result = await googleGeocode(query)
        if (result) {
          return result
        }
      } catch {
        // Ignore temporary geocoder failures and try the next variant.
      }
    }

    return null
  }

  const handleUpdateAddress = (type: 'from' | 'to', updatedAddress: AddressDetails) => {
    if (type === 'from') {
      setFromAddressDetails(updatedAddress)
    } else {
      setToAddressDetails(updatedAddress)
    }
  }

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again.')
      return
    }

    if (!pickupAddress.trim() || !destAddress.trim()) {
      Alert.alert('Missing route', 'Fill both pickup and delivery addresses.')
      return
    }

    if (!recipientName.trim() || !recipientPhone.trim()) {
      Alert.alert('Missing receiver', 'Fill receiver name and phone number.')
      return
    }

    setLoading(true)

    try {
      const pickupStreet = pickupAddress.trim()
      const deliveryStreet = destAddress.trim()

      const [resolvedPickupCoords, resolvedDeliveryCoords] = await Promise.all([
        pickupCoords
          ? Promise.resolve(pickupCoords)
          : pickupStreet === initialPickupAddress.trim() && initialPickupCoordinates
            ? Promise.resolve(initialPickupCoordinates)
            : geocodeOrderAddress(pickupStreet),
        deliveryCoords
          ? Promise.resolve(deliveryCoords)
          : deliveryStreet === initialDeliveryAddress.trim() && initialDeliveryCoordinates
            ? Promise.resolve(initialDeliveryCoordinates)
          : geocodeOrderAddress(deliveryStreet),
      ])

      const response = await createParcelOrder(accessToken, {
        pickupAddress: pickupStreet,
        pickupLat: resolvedPickupCoords?.latitude,
        pickupLon: resolvedPickupCoords?.longitude,
        pickupContactName: pickupContactName.trim(),
        pickupContactPhone: pickupContactPhone.trim() || fromAddressDetails.phone.trim(),
        deliveryAddress: deliveryStreet,
        deliveryLat: resolvedDeliveryCoords?.latitude,
        deliveryLon: resolvedDeliveryCoords?.longitude,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || toAddressDetails.phone.trim(),
        packageDescription: `${parcelSize.title} - ${packageDesc.trim() || 'Parcel'}`,
        parcelSize: parcelSize.id,
        totalPrice: totalPrice,
        comment: transport.id === 'SCHEDULED'
          ? (notes.trim() ? `${notes.trim()} (Scheduled for: ${selectedDate} at ${selectedTime})` : `Scheduled for: ${selectedDate} at ${selectedTime}`)
          : notes.trim(),
        serviceType: transport.id,
      })

      if (!response.ok) {
        Alert.alert('Order failed', response.error.message)
        return
      }

      if (!response.data.success) {
        Alert.alert('Order failed', response.data.error?.message ?? 'Unable to create parcel order.')
        return
      }

      const createdOrderId =
        response.data.data?.orderId ??
        response.data.data?.id

      if (createdOrderId && (resolvedPickupCoords || resolvedDeliveryCoords)) {
        await AsyncStorage.setItem(
          `order_${createdOrderId}`,
          JSON.stringify({
            pickupLat: resolvedPickupCoords?.latitude ?? null,
            pickupLon: resolvedPickupCoords?.longitude ?? null,
            deliveryLat: resolvedDeliveryCoords?.latitude ?? null,
            deliveryLon: resolvedDeliveryCoords?.longitude ?? null,
          }),
        )
      }

      onCreated?.(createdOrderId)
    } catch (error) {
      Alert.alert(
        'Order failed',
        error instanceof Error ? error.message : 'Unable to create parcel order.',
      )
    } finally {
      setLoading(false)
    }
  }

  const contentTranslate = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  })

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.navbar,
          {
            height: insets.top + 58,
            paddingTop: insets.top + 4,
          },
        ]}
      >
        <TouchableOpacity style={styles.navBackBtn} onPress={onBackPress} activeOpacity={0.75}>
          <Text style={styles.navBackText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.navTitle}>Create Shipment</Text>

        <View style={styles.navRightPlaceholder} />
      </View>

      <Animated.View
        style={[
          styles.animatedWrap,
          { opacity: contentAnim, transform: [{ translateY: contentTranslate }] },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 82,
              paddingBottom: 134 + Math.max(insets.bottom, 0),
            },
          ]}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroInner}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>New Order</Text>
              </View>

              <Text style={styles.heroTitle}>
                Enter delivery{'\n'}details
              </Text>
              <Text style={styles.heroSubtitle}>Fast and secure delivery across the city</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <Text style={styles.cardTitle}>Route</Text>

            <View style={styles.routeBody}>
              <View style={styles.routeLine}>
                <View style={styles.routeIconWrap}>
                  <Image source={ICONS.from} style={styles.routeIconImage} resizeMode="contain" />
                </View>

                <View style={styles.routeDash} />

                <View style={styles.routeIconWrap}>
                  <Image source={ICONS.to} style={styles.routeIconImage} resizeMode="contain" />
                </View>
              </View>

              <View style={styles.routeInputs}>
                <View>
                  <Text style={styles.fieldLabel}>From</Text>
                  <TouchableOpacity
                    style={[styles.inputSoft, styles.inputTouchable]}
                    onPress={() => setActiveAddressModal('from')}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.inputTouchableText,
                        !pickupAddress && styles.inputTouchablePlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {pickupAddress || '123 Origin St, City Center'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroupSpacing}>
                  <Text style={styles.fieldLabel}>To</Text>
                  <TouchableOpacity
                    style={[styles.inputSoft, styles.inputTouchable]}
                    onPress={() => setActiveAddressModal('to')}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.inputTouchableText,
                        !destAddress && styles.inputTouchablePlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {destAddress || 'Receiver address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Delivery Type</Text>

            <View style={styles.deliveryRow}>
              {TRANSPORT_TYPES.map(item => {
                const active = transport.id === item.id

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.deliveryCard, active && styles.deliveryCardActive]}
                    onPress={() => item.id === 'SCHEDULED' ? openScheduleModal() : setTransport(item)}
                    activeOpacity={0.85}
                  >
                    {item.desc ? (
                      <View style={styles.fastBadge}>
                        <Text style={styles.fastBadgeText}>{item.desc}</Text>
                      </View>
                    ) : null}

                    <Image source={item.icon} style={styles.deliveryIconImage} resizeMode="contain" />

                    <Text style={[styles.deliveryTitle, active && styles.deliveryTitleActive]}>
                      {item.label}
                    </Text>

                    <Text style={styles.deliveryPrice}>₸{item.basePrice.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {transport.id === 'SCHEDULED' && (
              <View style={styles.scheduleHint}>
                <Feather name="clock" size={14} color="#FF7A59" />
                <Text style={styles.scheduleHintText}>
                  Delivery scheduled for {selectedDate} at {selectedTime}
                </Text>
                <TouchableOpacity onPress={openScheduleModal}>
                  <Text style={styles.scheduleHintChange}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.doorToDoorRow}>
              <View style={styles.doorToDoorTextWrap}>
                <Text style={styles.doorToDoorTitle}>Door-to-door delivery</Text>
                <Text style={styles.doorToDoorDesc}>Courier picks up and delivers directly to the door</Text>
              </View>
              <Switch
                trackColor={{ false: '#E2E8F0', true: '#FFE4DE' }}
                thumbColor={doorToDoor ? '#FF7A59' : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
                onValueChange={setDoorToDoor}
                value={doorToDoor}
              />
            </View>
          </View>

          <View style={styles.peopleStack}>
            <View style={styles.personCard}>
              <View style={styles.personHeader}>
                <Image source={ICONS.sender} style={styles.personIconImage} resizeMode="contain" />
                <Text style={styles.cardTitle}>Sender</Text>
              </View>

              <TextInput
                style={styles.inputWhite}
                value={pickupContactName}
                onChangeText={setPickupContactName}
                placeholder="Alex Johnson"
                placeholderTextColor="#241916"
              />

              <TextInput
                style={[styles.inputWhite, styles.inputSpacing]}
                value={pickupContactPhone}
                onChangeText={setPickupContactPhone}
                placeholder="+7 (777) 123-45-67"
                placeholderTextColor="#241916"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.personCard}>
              <View style={styles.personHeader}>
                <Image source={ICONS.receiver} style={styles.personIconImage} resizeMode="contain" />
                <Text style={styles.cardTitle}>Receiver</Text>
              </View>

              <TextInput
                style={styles.inputWhite}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Name"
                placeholderTextColor="#6B7280"
              />

              <TextInput
                style={[styles.inputWhite, styles.inputSpacing]}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="Phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.parcelTitle}>Parcel Size</Text>

            <View style={styles.parcelStack}>
              {PARCEL_SIZES.map(item => {
                const active = parcelSize.id === item.id

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.parcelCard, active && styles.parcelCardActive]}
                    onPress={() => setParcelSize(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.parcelIconWrap}>
                      <Image source={item.icon} style={styles.parcelIconImage} resizeMode="contain" />
                    </View>

                    <View style={styles.parcelTextWrap}>
                      <Text style={styles.parcelItemTitle}>{item.title}</Text>
                      <Text style={styles.parcelItemDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.packageInputWrap}>
              <Image source={ICONS.box} style={styles.packageIconImage} resizeMode="contain" />

              <TextInput
                style={[styles.inputWhite, styles.packageInput]}
                value={packageDesc}
                onChangeText={setPackageDesc}
                placeholder="What are you sending?"
                placeholderTextColor="#6B7280"
              />
            </View>

            <TextInput
              style={[styles.inputWhite, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Comment for courier (optional)"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
            />

            {/* Price Details Breakdown */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.parcelTitle}>Price Details</Text>
              <View style={styles.priceDetailsCard}>
                <View style={styles.priceDetailsRow}>
                  <Text style={styles.priceDetailsText}>Base Fare ({transport.label})</Text>
                  <Text style={styles.priceDetailsValue}>₸{transport.basePrice}</Text>
                </View>
                
                <View style={styles.priceDetailsRow}>
                  <Text style={styles.priceDetailsText}>Distance ({distanceKm.toFixed(1)} km)</Text>
                  <Text style={styles.priceDetailsValue}>₸{Math.round(distanceKm * 150)}</Text>
                </View>

                {parcelSize.id !== 'SMALL' && (
                  <View style={styles.priceDetailsRow}>
                    <Text style={styles.priceDetailsText}>Box Size ({parcelSize.title})</Text>
                    <Text style={styles.priceDetailsValue}>
                      +₸{parcelSize.id === 'MEDIUM' ? 300 : 600}
                    </Text>
                  </View>
                )}

                {doorToDoor && (
                  <View style={styles.priceDetailsRow}>
                    <Text style={styles.priceDetailsText}>Door-to-door Surcharge</Text>
                    <Text style={styles.priceDetailsValue}>+₸200</Text>
                  </View>
                )}

                <View style={styles.priceDetailsRow}>
                  <Text style={styles.priceDetailsText}>Service Fee</Text>
                  <Text style={styles.priceDetailsValue}>+₸150</Text>
                </View>

                <View style={styles.priceDetailsDivider} />

                <View style={styles.priceDetailsRow}>
                  <Text style={[styles.priceDetailsText, styles.priceDetailsTotalText]}>Total Price</Text>
                  <Text style={[styles.priceDetailsValue, styles.priceDetailsTotalValue]}>₸{totalPrice}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(20, insets.bottom + 8),
          },
        ]}
      >
        <View>
          <Text style={styles.priceLabel}>Estimated cost</Text>
          <Text style={styles.priceValue}>≈ ₸{estimatedPrice().toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Place order</Text>
              <Text style={styles.confirmArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <UserParcelAddressDetailsModal
        visible={activeAddressModal === 'from'}
        type="from"
        address={fromAddressDetails}
        onClose={() => setActiveAddressModal(null)}
        onUpdate={updated => handleUpdateAddress('from', updated)}
        onChangeAddress={() => {
          setActiveAddressModal(null)
          setPickupSearchMode('search')
          setPickupSearchVisible(true)
        }}
        onChooseOnMap={() => {
          setActiveAddressModal(null)
          setPickupSearchMode('map')
          setPickupSearchVisible(true)
        }}
      />

      <UserParcelAddressDetailsModal
        visible={activeAddressModal === 'to'}
        type="to"
        address={toAddressDetails}
        onClose={() => setActiveAddressModal(null)}
        onUpdate={updated => handleUpdateAddress('to', updated)}
        onChangeAddress={() => {
          setActiveAddressModal(null)
          setDestSearchMode('search')
          setDestSearchVisible(true)
        }}
        onChooseOnMap={() => {
          setActiveAddressModal(null)
          setDestSearchMode('map')
          setDestSearchVisible(true)
        }}
      />

      <ParcelAddressSearchModal
        visible={pickupSearchVisible}
        title="Pickup Point"
        initialAddress={pickupAddress}
        initialCoords={pickupCoords}
        initialMode={pickupSearchMode}
        onClose={() => setPickupSearchVisible(false)}
        onSelect={(address, coords) => {
          setPickupAddress(address)
          setPickupCoords(coords)
        }}
      />

      <ParcelAddressSearchModal
        visible={destSearchVisible}
        title="Destination"
        initialAddress={destAddress}
        initialCoords={deliveryCoords}
        initialMode={destSearchMode}
        onClose={() => setDestSearchVisible(false)}
        onSelect={(address, coords) => {
          setDestAddress(address)
          setDeliveryCoords(coords)
        }}
      />

      <Modal
        transparent
        animationType="slide"
        visible={showScheduleModal}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.schedModalOverlay}>
          <Pressable style={styles.schedModalBackdrop} onPress={() => setShowScheduleModal(false)} />

          <View style={styles.schedModalSheet}>
            <View style={styles.schedModalHandle} />

            <View style={styles.schedModalHeader}>
              <Text style={styles.schedModalTitle}>Schedule delivery</Text>
              <Pressable
                style={styles.schedModalCloseBtn}
                onPress={() => setShowScheduleModal(false)}
              >
                <Feather name="x" size={18} color="#58423c" />
              </Pressable>
            </View>

            <View style={styles.schedColumnsWrap}>
              <ScrollView style={styles.schedColumn} showsVerticalScrollIndicator={false}>
                <View style={styles.schedColumnInner}>
                  {DATE_SLOTS.map(date => {
                    const active = tempDate === date
                    return (
                      <Pressable
                        key={date}
                        onPress={() => setTempDate(date)}
                        style={[styles.schedSlot, active && styles.schedSlotActive]}
                      >
                        <Text style={[styles.schedSlotText, active && styles.schedSlotTextActive]}>
                          {date}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>

              <ScrollView style={styles.schedColumn} showsVerticalScrollIndicator={false}>
                <View style={styles.schedColumnInner}>
                  {TIME_SLOTS.map(time => {
                    const active = tempTime === time
                    return (
                      <Pressable
                        key={time}
                        onPress={() => setTempTime(time)}
                        style={[styles.schedSlot, active && styles.schedSlotActive]}
                      >
                        <Text style={[styles.schedSlotText, active && styles.schedSlotTextActive]}>
                          {time}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            </View>

            <Pressable style={styles.schedConfirmBtn} onPress={confirmSchedule}>
              <Text style={styles.schedConfirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const shadowSoft = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 4,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackText: {
    fontSize: 34,
    lineHeight: 34,
    color: '#475569',
    fontWeight: '400',
    marginTop: -2,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  navRightPlaceholder: {
    width: 36,
    height: 36,
  },
  animatedWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    minHeight: SCREEN_HEIGHT,
  },
  heroCard: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFDAD2',
    marginBottom: 32,
    ...shadowSoft,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
    backgroundColor: '#DFA09E',
  },
  heroInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginBottom: 8,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.24,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginTop: 2,
  },
  routeCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 32,
    ...shadowSoft,
  },
  cardTitle: {
    color: '#241916',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  routeBody: {
    marginTop: 16,
    flexDirection: 'row',
  },
  routeLine: {
    width: 28,
    alignItems: 'center',
    paddingTop: 26,
    marginRight: 8,
  },
  routeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1ED',
  },
  routeIconImage: {
    width: 16,
    height: 16,
  },
  routeDash: {
    width: 1,
    height: 42,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DFC0B8',
  },
  routeInputs: {
    flex: 1,
  },
  fieldLabel: {
    color: '#58423C',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.24,
    marginLeft: 4,
    marginBottom: 4,
  },
  inputGroupSpacing: {
    marginTop: 16,
  },
  inputSoft: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(223,192,184,0.50)',
    backgroundColor: '#FFF8F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#241916',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  inputTouchable: {
    justifyContent: 'center',
  },
  inputTouchableText: {
    color: '#241916',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  inputTouchablePlaceholder: {
    color: '#6B7280',
  },
  block: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#241916',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 16,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(223,192,184,0.30)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deliveryCardActive: {
    borderWidth: 2,
    borderColor: '#FF7A59',
    backgroundColor: '#FFF1ED',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  deliveryIconImage: {
    width: 26,
    height: 26,
    marginBottom: 8,
  },
  deliveryTitle: {
    color: '#241916',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.14,
  },
  deliveryTitleActive: {
    color: '#FF7A59',
    fontWeight: '700',
  },
  deliveryPrice: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginTop: 4,
  },
  fastBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FF7A59',
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 18,
  },
  fastBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '400',
  },
  peopleStack: {
    marginBottom: 32,
    gap: 16,
  },
  personCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    ...shadowSoft,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  personIconImage: {
    width: 20,
    height: 20,
  },
  inputWhite: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(223,192,184,0.50)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#241916',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  inputSpacing: {
    marginTop: 12,
  },
  parcelTitle: {
    color: '#191C1E',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  parcelStack: {
    gap: 8,
    marginBottom: 12,
  },
  parcelCard: {
    minHeight: 80,
    borderRadius: 32,
    backgroundColor: '#F2F4F6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  parcelCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A7391E',
  },
  parcelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelIconImage: {
    width: 22,
    height: 22,
  },
  parcelTextWrap: {
    flex: 1,
  },
  parcelItemTitle: {
    color: '#191C1E',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  parcelItemDesc: {
    color: 'rgba(25,28,30,0.70)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  packageInputWrap: {
    position: 'relative',
    marginTop: 4,
  },
  packageIconImage: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 2,
    width: 20,
    height: 20,
  },
  packageInput: {
    paddingLeft: 48,
    borderColor: 'rgba(177,173,173,0.50)',
  },
  notesInput: {
    marginTop: 12,
    minHeight: 96,
    borderColor: 'rgba(177,173,173,0.50)',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  priceLabel: {
    color: '#58423C',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.24,
  },
  priceValue: {
    color: '#241916',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  confirmBtn: {
    minWidth: 154,
    borderRadius: 20,
    backgroundColor: '#FF7A59',
    paddingHorizontal: 26,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.14,
  },
  confirmArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scheduleHint: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  scheduleHintText: {
    flex: 1,
    color: '#58423C',
    fontSize: 13,
    fontWeight: '500',
  },
  scheduleHintChange: {
    color: '#FF7A59',
    fontSize: 13,
    fontWeight: '700',
  },
  schedModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.4)',
  },
  schedModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  schedModalSheet: {
    minHeight: 450,
    maxHeight: '78%',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 12,
  },
  schedModalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    marginBottom: 24,
    backgroundColor: '#e0e3e5',
  },
  schedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  schedModalTitle: {
    color: '#191c1e',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  schedModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  schedColumnsWrap: {
    flexDirection: 'row',
    height: 220,
    gap: 16,
    marginBottom: 24,
  },
  schedColumn: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    borderRadius: 24,
    padding: 8,
  },
  schedColumnInner: {
    paddingBottom: 16,
  },
  schedSlot: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  schedSlotActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.08)',
    borderColor: '#FF7A59',
  },
  schedSlotText: {
    color: '#191c1e',
    fontSize: 15,
    fontWeight: '600',
  },
  schedSlotTextActive: {
    color: '#FF7A59',
    fontWeight: '700',
  },
  schedConfirmBtn: {
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c65432',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  schedConfirmText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  priceDetailsCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginTop: 8,
  },
  priceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceDetailsText: {
    fontSize: 14,
    color: '#57534E',
  },
  priceDetailsValue: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  priceDetailsDivider: {
    height: 1,
    backgroundColor: '#E7E5E4',
    marginVertical: 8,
  },
  priceDetailsTotalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  priceDetailsTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF7A59',
  },
  doorToDoorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  doorToDoorTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  doorToDoorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  doorToDoorDesc: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
})
