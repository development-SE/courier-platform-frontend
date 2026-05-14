import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParcelOrder } from '../../data/ordersApi'
import { UserParcelAddressDetailsModal } from './UserParcelAddressDetailsModal'

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

type AddressDetails = {
  street: string
  city: string
  entrance: string
  apt: string
  floor: string
  doorCode: string
  phone: string
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
]

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
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [fromAddressDetails, setFromAddressDetails] = useState<AddressDetails>({
    street: '',
    city: 'Almaty',
    entrance: 'Main',
    apt: '',
    floor: '',
    doorCode: '',
    phone: '',
  })
  const [toAddressDetails, setToAddressDetails] = useState<AddressDetails>({
    street: '',
    city: 'Almaty',
    entrance: 'Side gate',
    apt: 'House',
    floor: '',
    doorCode: '',
    phone: '',
  })

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

  const estimatedPrice = () => transport.basePrice

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
        const results = await Location.geocodeAsync(query)
        if (results[0]) {
          return {
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          }
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
      return
    }

    setToAddressDetails(updatedAddress)
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

      const [pickupCoords, deliveryCoords] = await Promise.all([
        pickupStreet === initialPickupAddress.trim() && initialPickupCoordinates
          ? Promise.resolve(initialPickupCoordinates)
          : geocodeOrderAddress(pickupStreet),
        deliveryStreet === initialDeliveryAddress.trim() && initialDeliveryCoordinates
          ? Promise.resolve(initialDeliveryCoordinates)
          : geocodeOrderAddress(deliveryStreet),
      ])

      const response = await createParcelOrder(accessToken, {
        pickupAddress: pickupStreet,
        pickupLat: pickupCoords?.latitude,
        pickupLon: pickupCoords?.longitude,
        pickupContactName: pickupContactName.trim(),
        pickupContactPhone: pickupContactPhone.trim() || fromAddressDetails.phone.trim(),
        deliveryAddress: deliveryStreet,
        deliveryLat: deliveryCoords?.latitude,
        deliveryLon: deliveryCoords?.longitude,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || toAddressDetails.phone.trim(),
        packageDescription: `${parcelSize.title} - ${packageDesc.trim() || 'Parcel'}`,
        comment: notes.trim(),
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

      if (createdOrderId && (pickupCoords || deliveryCoords)) {
        await AsyncStorage.setItem(
          `order_${createdOrderId}`,
          JSON.stringify({
            pickupLat: pickupCoords?.latitude ?? null,
            pickupLon: pickupCoords?.longitude ?? null,
            deliveryLat: deliveryCoords?.latitude ?? null,
            deliveryLon: deliveryCoords?.longitude ?? null,
          }),
        )
      }

      Alert.alert('Order created!', 'Courier will be assigned shortly.', [
        {
          text: 'Open orders',
          onPress: () => onCreated?.(createdOrderId),
        },
      ])
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
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={[styles.inputSoft, styles.inputWithButtonField]}
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      placeholder="123 Origin St, City Center"
                      placeholderTextColor="#241916"
                    />
                    <TouchableOpacity
                      style={styles.addressDetailBtn}
                      onPress={() => setShowAddressModal(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addressDetailBtnIcon}>i</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroupSpacing}>
                  <Text style={styles.fieldLabel}>To</Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={[styles.inputSoft, styles.inputWithButtonField]}
                      value={destAddress}
                      onChangeText={setDestAddress}
                      placeholder="Receiver address"
                      placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity
                      style={styles.addressDetailBtn}
                      onPress={() => setShowAddressModal(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addressDetailBtnIcon}>i</Text>
                    </TouchableOpacity>
                  </View>
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
                    onPress={() => setTransport(item)}
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
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        fromAddress={fromAddressDetails}
        toAddress={toAddressDetails}
        onUpdateAddress={handleUpdateAddress}
      />
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
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithButtonField: {
    flex: 1,
    margin: 0,
  },
  addressDetailBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(223,192,184,0.50)',
    backgroundColor: '#FFF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressDetailBtnIcon: {
    fontSize: 18,
    lineHeight: 18,
    color: '#6B7280',
    fontWeight: '700',
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
})
