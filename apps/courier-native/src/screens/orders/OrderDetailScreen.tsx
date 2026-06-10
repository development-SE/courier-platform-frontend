import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useShallow } from 'zustand/react/shallow'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_IDS, ROOT_ROUTES } from '../../constants/screenIds'
import { appTheme } from '../../theme/appTheme'
import { fetchDashboardSnapshotFromCore, fetchOrdersFromCore } from '../../data/coreClient'
import type { RootStackParamList } from '../../navigation/types'
import { useShiftStore } from '../../store/shiftStore'
import { useAuthStore } from '../../store/authStore'
import { getOrderDetails, getAssignment, type AssignmentStatus } from '../../data/logisticsApi'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.ORDER_DETAIL>

type OrderView = {
  id: string
  client: string
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  deliveryAddress: string
  earnings: number
  distance: string
  estimatedMin: number
  pickupCode: string
  clientPhone: string
  comment: string
  parcelsCount: number
  payment: string
  serviceType: string
  items?: { name: string; quantity: number }[]
}

const ACTIVE_STAGE_ACTION_LABEL: Record<'arrived' | 'pickedUp' | 'onWay' | 'delivered', string> = {
  arrived: 'Arrived at Pickup',
  pickedUp: 'Picked up',
  onWay: 'In transit',
  delivered: 'Delivered',
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' ? value : fallback
}

function normalizePayment(payment: string) {
  if (!payment) return 'Cashless'
  return payment === 'cashless' ? 'Cashless' : payment
}



export function OrderDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets()
  const { orderId, assignmentId } = route.params || {}

  const accessToken = useAuthStore(state => state.accessToken)

  const { data: realOrder, isLoading: isRealOrderLoading } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      if (!accessToken) return null
      const res = await getOrderDetails(accessToken, orderId)
      if (res.ok && res.data?.success && res.data?.data) {
        return res.data.data
      }
      return null
    },
    enabled: !!accessToken && !!orderId,
  })

  const { data: realAssignment, isLoading: isRealAssignmentLoading, refetch: refetchAssignment } = useQuery({
    queryKey: ['assignment-details', assignmentId],
    queryFn: async () => {
      if (!accessToken || !assignmentId) return null
      const res = await getAssignment(accessToken, assignmentId)
      if (res.ok && res.data?.success && res.data?.data) {
        return res.data.data
      }
      return null
    },
    enabled: !!accessToken && !!assignmentId,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersFromCore,
  })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard-snapshot'],
    queryFn: fetchDashboardSnapshotFromCore,
  })

  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [codeTimedOut, setCodeTimedOut] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [hasStartedInitialCooldown, setHasStartedInitialCooldown] = useState(false)
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = (seconds = 60) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current)
    }
    setResendCooldown(seconds)
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current)
            cooldownTimerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (isOtpModalVisible && !hasStartedInitialCooldown) {
      setHasStartedInitialCooldown(true)
      startCooldown(60)
    }
  }, [isOtpModalVisible, hasStartedInitialCooldown])

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setHasStartedInitialCooldown(false)
  }, [assignmentId])

  const {
    activeOrderId,
    stage,
    advanceStage,
    verifyOTP,
    cancelActiveOrder,
    actionPendingAssignmentId,
    actionError,
    acceptAssignment,
    rejectAssignment,
    statusMutationAssignmentId,
    statusMutationError,
    updateAssignmentStatus,
    verifyingDeliveryCodeAssignmentId,
    deliveryCodeError,
    verifyDeliveryCode,
    resendDeliveryCode,
    confirmedCodes,
  } = useShiftStore(useShallow(state => ({
    activeOrderId: state.activeOrderId,
    stage: state.stage,
    advanceStage: state.advanceStage,
    verifyOTP: state.verifyOTP,
    cancelActiveOrder: state.cancelActiveOrder,
    actionPendingAssignmentId: state.actionPendingAssignmentId,
    actionError: state.actionError,
    acceptAssignment: state.acceptAssignment,
    rejectAssignment: state.rejectAssignment,
    statusMutationAssignmentId: state.statusMutationAssignmentId,
    statusMutationError: state.statusMutationError,
    updateAssignmentStatus: state.updateAssignmentStatus,
    verifyingDeliveryCodeAssignmentId: state.verifyingDeliveryCodeAssignmentId,
    deliveryCodeError: state.deliveryCodeError,
    verifyDeliveryCode: state.verifyDeliveryCode,
    resendDeliveryCode: state.resendDeliveryCode,
    confirmedCodes: state.confirmedCodes,
  })))

  const courierProfile = useAuthStore(state => state.courierProfile)
  const courierType = courierProfile?.courierType || 'EMPLOYEE'

  useEffect(() => { void useShiftStore.getState().initConfirmedCodes?.() }, [])

  const confirmedCode = orderId ? confirmedCodes[orderId] : undefined

  const isPending = realAssignment?.assignmentStatus === 'PENDING'
  const isContractor = courierType === 'CONTRACTOR'
  const showAcceptReject = isPending && isContractor

  const isMutationPending = actionPendingAssignmentId === assignmentId

  const handleAccept = async () => {
    if (!assignmentId) return
    const success = await acceptAssignment(assignmentId)
    if (success) {
      Alert.alert('Успех', 'Заказ успешно принят!')
      void refetchAssignment()
    } else {
      Alert.alert('Ошибка', actionError || 'Не удалось принять заказ')
    }
  }

  const handleReject = async () => {
    if (!assignmentId) return
    const success = await rejectAssignment(assignmentId, 'Rejected by courier')
    if (success) {
      Alert.alert('Отклонено', 'Вы отклонили этот заказ')
      navigation.goBack()
    } else {
      Alert.alert('Ошибка', actionError || 'Не удалось отклонить заказ')
    }
  }

  const order = useMemo<OrderView | null>(() => {
    if (realOrder) {
      const recipientNameParts = [realOrder.recipientInfo?.name, realOrder.recipientInfo?.surname].filter(Boolean)
      const recipientName = recipientNameParts.length > 0 ? recipientNameParts.join(' ') : 'Client'
      const recipientPhone = realOrder.recipientInfo?.phone || '+7 777 000 0000'
      const clientName = realOrder.pickupInfo?.name || realOrder.pickupAddress?.street || 'Pickup point'

      const pickupContact = realOrder.pickupInfo
      const clientContactNameParts = [pickupContact?.name, pickupContact?.surname].filter(Boolean)
      const clientContactName = clientContactNameParts.length > 0
        ? clientContactNameParts.join(' ')
        : recipientName
      const clientContactPhone = pickupContact?.phone || recipientPhone

      return {
        id: realOrder.orderId,
        client: clientName,
        recipientName,
        recipientPhone,
        pickupAddress: realOrder.pickupAddress?.street || 'Astana Store',
        deliveryAddress: realOrder.deliveryAddress?.street || 'Delivery Address',
        earnings: realOrder.totalAmount || 1200,
        distance: '2.4 km',
        estimatedMin: 15,
        pickupCode: realOrder.deliveryConfirmationCode || '000000',
        clientPhone: recipientPhone,
        comment: realOrder.comment || 'No instructions',
        parcelsCount: 1,
        payment: 'Cashless',
        serviceType: realOrder.serviceType || 'Food',
        items: realOrder.items?.map(i => ({ name: i.name || '', quantity: i.quantity })) || [],
      }
    }

    const bySeed = orders.find(item => item.id === orderId)

    if (bySeed) {
      const mockRecip = MOCK_RECIPIENTS[bySeed.client] || { name: 'Алия Сыздыкова', phone: bySeed.clientPhone || '+7 777 000 00 00' }
      return {
        id: bySeed.id,
        client: bySeed.client,
        recipientName: mockRecip.name,
        recipientPhone: mockRecip.phone,
        pickupAddress: bySeed.pickupAddress,
        deliveryAddress: bySeed.deliveryAddress,
        earnings: bySeed.earnings,
        distance: getString(dashboard?.incomingOrder.distance, '250m'),
        estimatedMin: getNumber(dashboard?.incomingOrder.estimatedMin, 12),
        pickupCode: getString(bySeed.pickupCode, getString(dashboard?.incomingOrder.pickupCode, '385987')),
        clientPhone: mockRecip.phone,
        comment: getString(bySeed.comment, 'Call 5 minutes before arrival'),
        parcelsCount: getNumber(bySeed.parcelsCount, getNumber(dashboard?.incomingOrder.parcelsCount, 1)),
        payment: normalizePayment(getString(bySeed.payment, getString(dashboard?.incomingOrder.payment, 'cashless'))),
        serviceType: getString(bySeed.serviceType, 'Food'),
        items: (CLIENT_MOCK_ITEMS[bySeed.client] || []).map(name => ({ name, quantity: 1 })),
      }
    }

    if (dashboard?.incomingOrder.id === orderId) {
      return {
        id: dashboard.incomingOrder.id,
        client: dashboard.incomingOrder.client,
        recipientName: MOCK_RECIPIENTS[dashboard.incomingOrder.client]?.name || 'Арман Исаев',
        recipientPhone: MOCK_RECIPIENTS[dashboard.incomingOrder.client]?.phone || '+7 701 555 33 22',
        pickupAddress: dashboard.incomingOrder.pickupAddress,
        deliveryAddress: dashboard.incomingOrder.deliveryAddress,
        earnings: dashboard.incomingOrder.earnings,
        distance: getString(dashboard.incomingOrder.distance, '250m'),
        estimatedMin: getNumber(dashboard.incomingOrder.estimatedMin, 12),
        pickupCode: getString(dashboard.incomingOrder.pickupCode, '385987'),
        clientPhone: MOCK_RECIPIENTS[dashboard.incomingOrder.client]?.phone || '+7 701 555 33 22',
        comment: getString(dashboard.incomingOrder.comment, 'Call 5 minutes before arrival'),
        parcelsCount: getNumber(dashboard.incomingOrder.parcelsCount, 1),
        payment: normalizePayment(getString(dashboard.incomingOrder.payment, 'cashless')),
        serviceType: getString(dashboard.incomingOrder.deliveryType || dashboard.incomingOrder.serviceType, 'Food'),
        items: (CLIENT_MOCK_ITEMS[dashboard.incomingOrder.client] || []).map(name => ({ name, quantity: 1 })),
      }
    }

    return null
  }, [realOrder, dashboard, orderId, orders])

  const isPickedUp = useMemo(() => {
    if (realAssignment) {
      return ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(realAssignment.assignmentStatus)
    }
    return ['pickedUp', 'onWay', 'delivered'].includes(stage)
  }, [realAssignment, stage])

  const isDelivered = useMemo(() => {
    if (realAssignment) {
      return realAssignment.assignmentStatus === 'DELIVERED'
    }
    return stage === 'delivered'
  }, [realAssignment, stage])

  const deliveryAddressTitle = useMemo(() => {
    if (realOrder?.deliveryAddress) {
      return [realOrder.deliveryAddress.street, realOrder.deliveryAddress.house].filter(Boolean).join(' ').trim() || 'Delivery Address'
    }
    return order?.deliveryAddress || 'Delivery Address'
  }, [realOrder, order])

  const deliveryAddressDetails = useMemo(() => {
    if (!realOrder?.deliveryAddress) return 'Entrance 2, floor 5'
    const details = []
    if (realOrder.deliveryAddress.entrance) details.push(`Entrance ${realOrder.deliveryAddress.entrance}`)
    if (realOrder.deliveryAddress.floor) details.push(`floor ${realOrder.deliveryAddress.floor}`)
    if (realOrder.deliveryAddress.apartment) details.push(`apt ${realOrder.deliveryAddress.apartment}`)
    return details.join(', ') || 'No details'
  }, [realOrder])

  const isActive = activeOrderId === orderId
  const actionLabel = ACTIVE_STAGE_ACTION_LABEL[stage]
  const courierName = dashboard?.courier ? `${dashboard.courier.name} ${dashboard.courier.lastName}`.trim() : 'Ivan Petrov'

  const transitionMeta = useMemo(() => {
    if (!realAssignment) return null

    const status = realAssignment.assignmentStatus
    switch (status) {
      case 'ASSIGNED':
      case 'ACCEPTED':
        return {
          nextStatus: 'PICKED_UP' as const,
          label: 'Mark Picked Up',
          reason: 'courier-picked-up',
          disabled: false,
          isPlaceholder: false,
          triggerOtpModal: false,
        }
      case 'PICKED_UP':
        return {
          nextStatus: 'IN_TRANSIT' as const,
          label: 'Start Delivery',
          reason: 'courier-departed',
          disabled: false,
          isPlaceholder: false,
          triggerOtpModal: false,
        }
      case 'IN_TRANSIT':
        return {
          nextStatus: 'ARRIVED' as const,
          label: 'Mark Arrived',
          reason: 'courier-arrived',
          disabled: false,
          isPlaceholder: false,
          triggerOtpModal: false,
        }
      case 'ARRIVED':
        return {
          nextStatus: null,
          label: 'Enter Confirmation Code',
          reason: '',
          disabled: false,
          isPlaceholder: false,
          triggerOtpModal: true,
        }
      default:
        return null
    }
  }, [realAssignment])

  const isTransitioning = statusMutationAssignmentId === assignmentId

  const handleTransition = async () => {
    if (!assignmentId || !transitionMeta) return
    if (transitionMeta.triggerOtpModal) {
      setIsOtpModalVisible(true)
      return
    }
    if (!transitionMeta.nextStatus) return
    const success = await updateAssignmentStatus(
      assignmentId,
      transitionMeta.nextStatus,
      transitionMeta.reason
    )
    if (success) {
      void refetchAssignment()
    }
  }

  const handleAdvance = async () => {
    if (stage === 'delivered') {
      setIsOtpModalVisible(true)
    } else {
      const completed = await advanceStage()
      if (completed) {
        navigation.goBack()
      }
    }
  }

  const [resending, setResending] = useState(false)
  const handleResendOTP = async () => {
    if (!assignmentId) return
    setResending(true)
    const success = await resendDeliveryCode(assignmentId)
    setResending(false)
    if (success) {
      setCodeTimedOut(false)
      setOtpCode('')
      Alert.alert('Успех', 'Новый код подтверждения отправлен клиенту!')
      startCooldown(60)
    } else {
      Alert.alert('Ошибка', 'Не удалось отправить код повторно')
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите код подтверждения')
      return
    }
    if (!assignmentId) return

    const success = await verifyDeliveryCode(assignmentId, otpCode.trim())
    if (success) {
      setIsOtpModalVisible(false)
      setOtpCode('')
      setCodeTimedOut(false)
      Alert.alert('Успех', 'Заказ успешно доставлен и подтвержден!')
      navigation.goBack()
    } else {
      const error = useShiftStore.getState().deliveryCodeError
      const isExpired = (error || '').toLowerCase().includes('expired')
      if (isExpired) {
        setCodeTimedOut(true)
        setOtpCode('')
      }
    }
  }

  if ((isRealOrderLoading || isRealAssignmentLoading) && !order) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topNav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="arrow-back" size={18} color="#f4f4f5" />
          </Pressable>
          <Text style={styles.topTitle}>Order Details</Text>
          <View style={styles.navIconBtn} />
        </View>
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.emptyTitle}>Loading details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topNav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="arrow-back" size={18} color="#f4f4f5" />
          </Pressable>
          <Text style={styles.topTitle}>Order Details</Text>
          <View style={styles.navIconBtn} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.emptyBackBtn}>
            <Text style={styles.emptyBackText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.navIconBtn}>
          <Ionicons name="arrow-back" size={18} color="#f4f4f5" />
        </Pressable>
        <Text style={styles.topTitle}>Order Details</Text>
        <Pressable style={styles.navIconBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color="#f4f4f5" />
        </Pressable>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 102 }]}
      >
        <View style={styles.pickupHeaderCard}>
          <View style={styles.pickupHeaderTopRow}>
            <View style={[styles.pickupPill, isPickedUp && styles.deliveryPill]}>
              <Text style={[styles.pickupPillText, isPickedUp && styles.deliveryPillText]}>
                {isPickedUp ? 'DELIVERY' : 'PICKUP'}
              </Text>
            </View>
            <Text style={styles.pickupDistanceText}>
              {isPickedUp ? 'Client Destination' : '250m away'}
            </Text>
            <View style={styles.pickupStoreIconWrap}>
              <Ionicons
                name={isPickedUp ? 'location-outline' : 'storefront-outline'}
                size={16}
                color="#ff9069"
              />
            </View>
          </View>
          <Text style={styles.pickupClient}>
            {isPickedUp ? deliveryAddressTitle : (order?.client || 'Pickup')}
          </Text>
          <Text style={styles.pickupAddress}>
            {isPickedUp ? deliveryAddressDetails : order.pickupAddress}
          </Text>
        </View>

        {realAssignment && (
          <View style={styles.statusSection}>
            <Text style={styles.statusSectionLabel}>STATUS</Text>
            <View style={[
              styles.statusSectionBadge,
              realAssignment.assignmentStatus === 'PENDING' ? styles.statusPending :
              ['ASSIGNED', 'ACCEPTED'].includes(realAssignment.assignmentStatus) ? styles.statusAssigned :
              ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(realAssignment.assignmentStatus) ? styles.statusActive :
              realAssignment.assignmentStatus === 'DELIVERED' ? styles.statusDelivered :
              styles.statusCancelled
            ]}>
              <Text style={[
                styles.statusSectionBadgeText,
                realAssignment.assignmentStatus === 'PENDING' ? { color: '#ff9069' } :
                ['ASSIGNED', 'ACCEPTED'].includes(realAssignment.assignmentStatus) ? { color: '#34d399' } :
                ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(realAssignment.assignmentStatus) ? { color: '#f59e0b' } :
                realAssignment.assignmentStatus === 'DELIVERED' ? { color: '#9997a1' } :
                { color: '#ef706a' }
              ]}>
                {realAssignment.assignmentStatus}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.authRow}>
          <View style={styles.authCardPrimary}>
            <Text style={styles.authLabel}>ORDER AUTHENTICATION</Text>
            <Text style={styles.authCode}>
              {isDelivered ? (confirmedCode || order.pickupCode || '------') : '000000'}
            </Text>
            <Text style={styles.authCodeHint}>
              {isDelivered ? 'delivery confirmed' : 'pickup code'}
            </Text>
            <Text style={styles.authOrderIdLabel}>Order ID</Text>
            <Text style={styles.authOrderId}>#{order.id}</Text>
          </View>
          <View style={styles.authCardSecondary}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>{order.earnings} KZT</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color="#ff9069" />
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.sectionText}>Pickup zone is located near the central cashier line. Tell staff your order number.</Text>
          <Text style={styles.sectionText}>Deliver order to the customer's door.</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="fast-food-outline" size={18} color="#ff9069" />
            <Text style={styles.sectionTitle}>Содержимое заказа</Text>
          </View>
          <View style={{ gap: 6, marginTop: 4 }}>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <Text key={idx} style={styles.sectionText}>
                  • {item.name} ({item.quantity} шт.)
                </Text>
              ))
            ) : (
              <Text style={styles.sectionText}>📦 Стандартная посылка</Text>
            )}
          </View>
        </View>

        {/* Client Contacts Card */}
        <View style={styles.sectionCard}>
          <View style={styles.courierTopRow}>
            <View style={styles.courierInfoWrap}>
              <View style={styles.courierAvatar}>
                <Ionicons name="person" size={18} color="#f2f2f5" />
              </View>
              <View>
                <Text style={styles.courierName}>{order.recipientName}</Text>
                <Text style={styles.courierPhone}>{order.recipientPhone}</Text>
              </View>
            </View>
            <View style={styles.courierActions}>
              <Pressable
                style={styles.courierActionBtn}
                onPress={() => Linking.openURL(`tel:${order.recipientPhone}`)}
              >
                <Ionicons name="call-outline" size={16} color="#ff9069" />
              </Pressable>
              <Pressable
                style={styles.courierActionBtn}
                onPress={() => Linking.openURL(`sms:${order.recipientPhone}`)}
              >
                <Ionicons name="chatbox-outline" size={16} color="#ff9069" />
              </Pressable>
            </View>
          </View>

        </View>


        {!isDelivered && (
          <Pressable
            style={styles.openRouteBtnStandalone}
            onPress={() => navigation.navigate(ROOT_ROUTES.MAIN_TABS)}
          >
            <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
            <Text style={styles.openRouteBtnStandaloneText}>Open route</Text>
          </Pressable>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>SERVICE TYPE</Text>
            <View style={styles.metaTitleRow}>
              <Ionicons name="cube-outline" size={16} color="#ff9069" />
              <Text style={styles.metaTitle}>{order.serviceType}</Text>
            </View>
            <Text style={styles.metaHint}>
              {order.serviceType.toLowerCase() === 'food' ? 'Food & Drinks Delivery' : 'Standard Delivery'}
            </Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>PAYMENT</Text>
            <View style={styles.metaTitleRow}>
              <Ionicons name="card-outline" size={16} color="#ffcf61" />
              <Text style={styles.metaTitle}>{order.payment}</Text>
            </View>
            <View style={styles.metaHintRow}>
              <View style={styles.metaHintDot} />
              <Text style={styles.metaHint}>In-app</Text>
            </View>
          </View>
        </View>

        <Text style={styles.supportTitle}>HELP & SUPPORT</Text>
        <View style={styles.supportRow}>
          <Pressable style={styles.supportBtn}>
            <Ionicons name="headset-outline" size={18} color="#f2f3f7" />
            <Text style={styles.supportBtnText}>Call support</Text>
          </Pressable>
          <Pressable style={styles.supportBtn}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#f2f3f7" />
            <Text style={styles.supportBtnText}>Chat with support</Text>
          </Pressable>
        </View>

        {!isPickedUp && (
          <Pressable style={styles.cancelBtn} onPress={() => void cancelActiveOrder()}>
            <Ionicons name="close-circle-outline" size={18} color="#ff716c" />
            <Text style={styles.cancelBtnText}>Cancel order</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.bottomActionWrap, { paddingBottom: insets.bottom + 8 }]}>
        {(statusMutationError || actionError) && (
          <View style={styles.inlineErrorBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#ef706a" />
            <Text style={styles.inlineErrorText} numberOfLines={2}>
              {statusMutationError || actionError}
            </Text>
          </View>
        )}

        {showAcceptReject ? (
          <View style={styles.buttonBar}>
            <Pressable
              style={[styles.rejectBtnDetail, isMutationPending && styles.disabledBtn]}
              onPress={handleReject}
              disabled={isMutationPending}
            >
              <Text style={styles.rejectBtnTextDetail}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.acceptBtnDetail, isMutationPending && styles.disabledBtn]}
              onPress={handleAccept}
              disabled={isMutationPending}
            >
              {isMutationPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.acceptBtnTextDetail}>Accept</Text>
              )}
            </Pressable>
          </View>
        ) : isPending && !isContractor ? (
          <View style={styles.fallbackBox}>
            <Ionicons name="hourglass-outline" size={18} color="#aeaaa7" />
            <Text style={styles.fallbackText}>Waiting for dispatcher assignment...</Text>
          </View>
        ) : transitionMeta ? (
          <Pressable
            style={[
              styles.bottomActionBtn,
              (transitionMeta.disabled || isTransitioning) && styles.disabledBtn,
              transitionMeta.isPlaceholder && styles.placeholderBtn,
            ]}
            onPress={handleTransition}
            disabled={transitionMeta.disabled || isTransitioning}
          >
            {isTransitioning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.bottomActionText,
                  transitionMeta.isPlaceholder && styles.placeholderBtnText,
                ]}
              >
                {transitionMeta.label}
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.bottomActionBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.bottomActionText}>Back</Text>
          </Pressable>
        )}
      </View>
      
      <Modal
        visible={isOtpModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#ff9069" />
              <Text style={styles.modalTitle}>Подтверждение доставки</Text>
            </View>
            <Text style={styles.modalText}>
              Пожалуйста, попросите у клиента 6-значный код подтверждения и введите его ниже для завершения доставки.
            </Text>

            {codeTimedOut && (
              <View style={styles.codeExpiredBanner}>
                <Ionicons name="time-outline" size={16} color="#f59e0b" />
                <Text style={styles.codeExpiredBannerText}>
                  Код устарел. Нажмите «Отправить повторно» — клиент получит новый код.
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.otpInput, codeTimedOut && styles.otpInputExpired]}
              placeholder="000000"
              placeholderTextColor="#6f7485"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={text => { setOtpCode(text); if (codeTimedOut) setCodeTimedOut(false) }}
              editable={!(verifyingDeliveryCodeAssignmentId === assignmentId) && !resending}
            />

            {deliveryCodeError && !codeTimedOut && (
              <Text style={styles.modalErrorText}>{deliveryCodeError}</Text>
            )}

            <Pressable
              style={[
                styles.resendContainer,
                codeTimedOut && styles.resendContainerHighlighted,
                (resending || resendCooldown > 0 || verifyingDeliveryCodeAssignmentId === assignmentId) && styles.disabledBtn,
              ]}
              onPress={handleResendOTP}
              disabled={resending || resendCooldown > 0 || verifyingDeliveryCodeAssignmentId === assignmentId}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#ff9069" />
              ) : (
                <Text
                  style={[
                    styles.resendText,
                    codeTimedOut && styles.resendTextHighlighted,
                    (resendCooldown > 0 || resending) && styles.resendTextDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? (codeTimedOut ? `Отправить новый код клиенту (${resendCooldown}с)` : `Не пришел код? Отправить повторно (${resendCooldown}с)`)
                    : (codeTimedOut ? 'Отправить новый код клиенту' : 'Не пришел код? Отправить повторно')}
                </Text>
              )}
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setIsOtpModalVisible(false)
                  setOtpCode('')
                  setCodeTimedOut(false)
                }}
                disabled={verifyingDeliveryCodeAssignmentId === assignmentId || resending}
              >
                <Text style={styles.modalBtnTextCancel}>Отмена</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleVerifyOTP}
                disabled={verifyingDeliveryCodeAssignmentId === assignmentId || resending}
              >
                {verifyingDeliveryCodeAssignmentId === assignmentId ? (
                  <ActivityIndicator size="small" color="#2d1b13" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>Подтвердить</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0e0c',
  },
  topNav: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1917',
    backgroundColor: '#10100e',
  },
  navIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#f4f4f5',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  pickupHeaderCard: {
    borderRadius: 16,
    backgroundColor: '#141311',
    padding: 16,
  },
  pickupHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,144,105,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pickupPillText: {
    color: '#ff9069',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pickupDistanceText: {
    marginLeft: 8,
    color: '#aeaaa7',
    fontSize: 12,
    fontWeight: '500',
  },
  pickupStoreIconWrap: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#221f1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupClient: {
    marginTop: 8,
    color: '#fff',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  pickupAddress: {
    marginTop: 4,
    color: '#aeaaa7',
    fontSize: 14,
    lineHeight: 20,
  },
  authRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authCardPrimary: {
    flex: 1.25,
    borderRadius: 16,
    backgroundColor: '#ff9069',
    padding: 16,
    minHeight: 168,
  },
  authCardSecondary: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2d2b29',
    backgroundColor: '#201f1d',
    padding: 14,
    minHeight: 168,
  },
  authLabel: {
    color: '#591800',
    opacity: 0.82,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  authCode: {
    marginTop: 8,
    color: '#591800',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
  },
  authCodeHint: {
    color: '#591800',
    opacity: 0.92,
    fontSize: 12,
    marginTop: 2,
  },
  authOrderIdLabel: {
    marginTop: 14,
    color: '#591800',
    opacity: 0.72,
    fontSize: 10,
    fontWeight: '600',
  },
  authOrderId: {
    marginTop: 2,
    color: '#591800',
    fontSize: 12,
    fontWeight: '700',
  },
  earningsLabel: {
    color: '#aeaaa7',
    fontSize: 14,
    lineHeight: 20,
  },
  earningsValue: {
    marginTop: 10,
    color: '#ff9069',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: '#201f1d',
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionText: {
    color: '#aeaaa7',
    fontSize: 14,
    lineHeight: 22,
  },
  courierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(73,72,69,0.1)',
  },
  courierInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  courierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2f3d47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierName: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  courierPhone: {
    marginTop: 2,
    color: '#aeaaa7',
    fontSize: 16,
  },
  courierActions: {
    flexDirection: 'row',
    gap: 8,
  },
  courierActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#201f1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  routeAddressWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  routeAddressTitle: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  routeAddressHint: {
    color: '#aeaaa7',
    fontSize: 12,
    marginTop: 2,
  },
  openRouteBtn: {
    borderRadius: 999,
    backgroundColor: 'rgba(150,73,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  openRouteText: {
    color: '#fc8f3c',
    fontSize: 12,
    fontWeight: '600',
  },
  openRouteBtnStandalone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fc8f3c',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  openRouteBtnStandaloneText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(252,143,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252,143,60,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteText: {
    color: '#fc8f3c',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#141311',
    padding: 16,
    gap: 8,
  },
  metaLabel: {
    color: '#aeaaa7',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  metaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  metaHint: {
    color: '#aeaaa7',
    fontSize: 10,
  },
  metaHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffc15c',
  },
  supportTitle: {
    marginTop: 2,
    color: '#aeaaa7',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  supportBtn: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#201f1d',
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  supportBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,113,108,0.3)',
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelBtnText: {
    color: '#ff716c',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActionWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 20,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bottomActionBtn: {
    borderRadius: 16,
    backgroundColor: '#cd5e3d',
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff9069',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomActionText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#f2f2f5',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyBackBtn: {
    borderRadius: 12,
    backgroundColor: '#cd5e3d',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyBackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#161924',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a2f3f',
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#f2f3f7',
    fontSize: 18,
    fontWeight: '700',
  },
  modalText: {
    color: '#9da2af',
    fontSize: 14,
    lineHeight: 20,
  },
  otpInput: {
    backgroundColor: '#090b10',
    borderWidth: 1,
    borderColor: '#ff9069',
    borderRadius: 14,
    color: '#ff9069',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 14,
    letterSpacing: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#202433',
    borderWidth: 1,
    borderColor: '#2a2f3f',
  },
  modalBtnConfirm: {
    backgroundColor: '#ff9069',
  },
  modalBtnTextCancel: {
    color: '#9da2af',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnTextConfirm: {
    color: '#2d1b13',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  acceptBtnDetail: {
    flex: 1.5,
    borderRadius: 16,
    backgroundColor: '#cd5e3d',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff9069',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  rejectBtnDetail: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 113, 108, 0.45)',
    backgroundColor: 'rgba(69, 30, 33, 0.15)',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnTextDetail: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  rejectBtnTextDetail: {
    color: '#ff716c',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 112, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 112, 106, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 6,
  },
  inlineErrorText: {
    color: '#ef706a',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fallbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1b18',
    borderRadius: 16,
    minHeight: 64,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2b2a26',
    gap: 10,
  },
  fallbackText: {
    color: '#aeaaa7',
    fontSize: 15,
    fontWeight: '600',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141311',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusSectionLabel: {
    color: '#aeaaa7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statusSectionBadge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusSectionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 144, 105, 0.12)',
    borderColor: 'rgba(255, 144, 105, 0.25)',
  },
  statusAssigned: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  statusDelivered: {
    backgroundColor: 'rgba(153, 151, 161, 0.12)',
    borderColor: 'rgba(153, 151, 161, 0.25)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 112, 106, 0.12)',
    borderColor: 'rgba(239, 112, 106, 0.25)',
  },
  placeholderBtn: {
    backgroundColor: '#1b1b18',
    borderColor: '#2b2a26',
    borderWidth: 1,
  },
  placeholderBtnText: {
    color: '#aeaaa7',
  },
  modalErrorText: {
    color: '#ef706a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  resendContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendContainerHighlighted: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 144, 105, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 144, 105, 0.4)',
  },
  resendText: {
    color: '#ff9069',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextHighlighted: {
    textDecorationLine: 'none',
    fontWeight: '700',
    fontSize: 14,
  },
  codeExpiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeExpiredBannerText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  otpInputExpired: {
    borderColor: 'rgba(245, 158, 11, 0.6)',
    color: '#6f7485',
  },
  deliveryPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
  },
  deliveryPillText: {
    color: '#34d399',
  },
  routeActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    justifyContent: 'flex-start',
  },
  resendTextDisabled: {
    color: '#6f7485',
    textDecorationLine: 'none',
  },
})
