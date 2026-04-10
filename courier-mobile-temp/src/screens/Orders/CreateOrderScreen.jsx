import { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { ordersApi } from '../../api/orders.api'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const TRANSPORT_TYPES = [
  {
    id: 'STANDARD',
    icon: '🚶',
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
    id: 'SCHEDULED',
    icon: '🕒',
    label: 'Плановая',
    desc: 'по времени',
    basePrice: 3000,
  },
]

export const CreateOrderScreen = ({ navigation, route }) => {
  const params = route?.params ?? {}

  const [pickupAddress, setPickupAddress] = useState(params.pickupAddress ?? '')
  const [destAddress, setDestAddress] = useState(params.destAddress ?? '')
  const [pickupContactName, setPickupContactName] = useState('')
  const [pickupContactPhone, setPickupContactPhone] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDesc, setPackageDesc] = useState('')
  const [notes, setNotes] = useState(params.comment ?? '')
  const [transport, setTransport] = useState(
    TRANSPORT_TYPES.find((item) => item.id === params.transportType) ?? TRANSPORT_TYPES[0]
  )
  const [loading, setLoading] = useState(false)

  const contentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start()
  }, [contentAnim])

  const estimatedPrice = () => transport.basePrice

  const geocodeOrderAddress = async (street) => {
    const normalizedStreet = street?.trim()
    if (!normalizedStreet) return null

    const queries = [
      `${normalizedStreet}, Астана, Kazakhstan`,
      `${normalizedStreet}, Astana, Kazakhstan`,
      normalizedStreet,
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
        console.warn('Failed to geocode address:', query, err)
      }
    }

    return null
  }

  const handleSubmit = async () => {
    if (!pickupAddress.trim() || !destAddress.trim()) {
      Alert.alert('Ошибка', 'Укажите адрес отправления и адрес доставки')
      return
    }

    if (!recipientName.trim() || !recipientPhone.trim()) {
      Alert.alert('Ошибка', 'Укажите имя и телефон получателя')
      return
    }

    setLoading(true)

    try {
      const pickupStreet = pickupAddress.trim()
      const deliveryStreet = destAddress.trim()

      const [pickupCoords, deliveryCoords] = await Promise.all([
        geocodeOrderAddress(pickupStreet),
        geocodeOrderAddress(deliveryStreet),
      ])

      const createdOrder = await ordersApi.create({
        pickupAddress: pickupStreet,
        pickupLat: pickupCoords?.latitude,
        pickupLon: pickupCoords?.longitude,
        pickupContactName: pickupContactName.trim(),
        pickupContactPhone: pickupContactPhone.trim(),
        deliveryAddress: deliveryStreet,
        deliveryLat: deliveryCoords?.latitude,
        deliveryLon: deliveryCoords?.longitude,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        packageDescription: packageDesc.trim(),
        comment: notes.trim(),
        serviceType: transport.id,
      })

      const createdOrderId =
        createdOrder?.data?.orderId || createdOrder?.orderId || createdOrder?.data?.id || createdOrder?.id

      if (createdOrderId && (pickupCoords || deliveryCoords)) {
        await AsyncStorage.setItem(
          `order_${createdOrderId}`,
          JSON.stringify({
            pickupLat: pickupCoords?.latitude ?? null,
            pickupLon: pickupCoords?.longitude ?? null,
            deliveryLat: deliveryCoords?.latitude ?? null,
            deliveryLon: deliveryCoords?.longitude ?? null,
          })
        )
      }

      Alert.alert(
        'Заказ создан!',
        'Курьер будет назначен в ближайшее время',
        [{ text: 'OK', onPress: () => navigation.navigate('OrdersTab') }]
      )
    } catch (err) {
      console.log('ERROR RESPONSE:', JSON.stringify(err?.response?.data, null, 2))
      console.log('ERROR STATUS:', err?.response?.status)

      const data = err?.response?.data
      const msg = typeof data === 'string'
        ? data
        : data?.message || data?.error || data?.detail || err?.message || 'Unknown error'

      Alert.alert('Ошибка', String(msg))
    } finally {
      setLoading(false)
    }
  }

  const contentTranslate = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  })

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.heroEyebrow}>Новый заказ</Text>
        <Text style={styles.heroTitle}>Заполните детали доставки</Text>
        <Text style={styles.heroSubtitle}>
          Без карты: просто введите адреса, получателя и описание посылки.
        </Text>
      </View>

      <Animated.View
        style={[
          styles.sheet,
          { opacity: contentAnim, transform: [{ translateY: contentTranslate }] },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.sectionLabel}>Маршрут</Text>
          <TextInput
            style={styles.input}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="Откуда забрать *"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, styles.inputSpacing]}
            value={destAddress}
            onChangeText={setDestAddress}
            placeholder="Куда доставить *"
            placeholderTextColor="#9ca3af"
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Тип доставки</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.transportRow}
          >
            {TRANSPORT_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.transportCard,
                  transport.id === item.id && styles.transportCardActive,
                ]}
                onPress={() => setTransport(item)}
              >
                <Text style={styles.transportIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.transportLabel,
                    transport.id === item.id && styles.transportLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.transportDesc}>{item.desc}</Text>
                <Text
                  style={[
                    styles.transportPrice,
                    transport.id === item.id && styles.transportPriceActive,
                  ]}
                >
                  от ₸{item.basePrice.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Отправитель</Text>
          <TextInput
            style={styles.input}
            value={pickupContactName}
            onChangeText={setPickupContactName}
            placeholder="Имя отправителя"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, styles.inputSpacing]}
            value={pickupContactPhone}
            onChangeText={setPickupContactPhone}
            placeholder="+7 700 000 0000"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Получатель</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Имя получателя *"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, styles.inputSpacing]}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            placeholder="+7 700 000 0000 *"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Посылка</Text>
          <TextInput
            style={styles.input}
            value={packageDesc}
            onChangeText={setPackageDesc}
            placeholder="Что отправляем?"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, styles.inputSpacing, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Комментарий для курьера"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />

          <View style={styles.footerCard}>
            <View>
              <Text style={styles.priceLabel}>Стоимость</Text>
              <Text style={styles.priceValue}>≈ ₸{estimatedPrice().toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Оформить заказ</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 72 : 40,
    paddingHorizontal: 20,
    paddingBottom: 28,
    backgroundColor: '#fc981d',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 10,
    maxWidth: 320,
  },
  sheet: {
    flex: 1,
    marginTop: -16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    minHeight: SCREEN_HEIGHT * 0.72,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputSpacing: {
    marginTop: 10,
  },
  notesInput: {
    minHeight: 88,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 18,
  },
  transportRow: {
    flexDirection: 'row',
  },
  transportCard: {
    width: 110,
    borderRadius: 18,
    padding: 14,
    marginRight: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  transportCardActive: {
    borderColor: '#FC3F1D',
    backgroundColor: '#fff4ef',
  },
  transportIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  transportLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  transportLabelActive: {
    color: '#FC3F1D',
  },
  transportDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  transportPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  transportPriceActive: {
    color: '#FC3F1D',
  },
  footerCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: '#FC3F1D',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 154,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
