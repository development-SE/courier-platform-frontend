import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useShallow } from 'zustand/react/shallow'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_IDS } from '../../constants/screenIds'
import { fetchDashboardSnapshotFromCore, fetchOrdersFromCore } from '../../data/coreClient'
import type { RootStackParamList } from '../../navigation/types'
import { useShiftStore } from '../../store/shiftStore'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.ORDER_DETAIL>

type OrderView = {
  id: string
  client: string
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
  const orderId = route.params.orderId

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersFromCore,
  })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard-snapshot'],
    queryFn: fetchDashboardSnapshotFromCore,
  })

  const { activeOrderId, stage, advanceStage, cancelActiveOrder } = useShiftStore(useShallow(state => ({
    activeOrderId: state.activeOrderId,
    stage: state.stage,
    advanceStage: state.advanceStage,
    cancelActiveOrder: state.cancelActiveOrder,
  })))

  const order = useMemo<OrderView | null>(() => {
    const bySeed = orders.find(item => item.id === orderId)

    if (bySeed) {
      return {
        id: bySeed.id,
        client: bySeed.client,
        pickupAddress: bySeed.pickupAddress,
        deliveryAddress: bySeed.deliveryAddress,
        earnings: bySeed.earnings,
        distance: getString(dashboard?.incomingOrder.distance, '250m'),
        estimatedMin: getNumber(dashboard?.incomingOrder.estimatedMin, 12),
        pickupCode: getString(bySeed.pickupCode, getString(dashboard?.incomingOrder.pickupCode, '385987')),
        clientPhone: getString(bySeed.clientPhone, getString(dashboard?.courier.phone, '+7 777 123 45 67')),
        comment: getString(bySeed.comment, 'Call 5 minutes before arrival'),
        parcelsCount: getNumber(bySeed.parcelsCount, getNumber(dashboard?.incomingOrder.parcelsCount, 1)),
        payment: normalizePayment(getString(bySeed.payment, getString(dashboard?.incomingOrder.payment, 'cashless'))),
      }
    }

    if (dashboard?.incomingOrder.id === orderId) {
      return {
        id: dashboard.incomingOrder.id,
        client: dashboard.incomingOrder.client,
        pickupAddress: dashboard.incomingOrder.pickupAddress,
        deliveryAddress: dashboard.incomingOrder.deliveryAddress,
        earnings: dashboard.incomingOrder.earnings,
        distance: getString(dashboard.incomingOrder.distance, '250m'),
        estimatedMin: getNumber(dashboard.incomingOrder.estimatedMin, 12),
        pickupCode: getString(dashboard.incomingOrder.pickupCode, '385987'),
        clientPhone: getString(dashboard?.courier.phone, '+7 777 123 45 67'),
        comment: getString(dashboard.incomingOrder.comment, 'Call 5 minutes before arrival'),
        parcelsCount: getNumber(dashboard.incomingOrder.parcelsCount, 1),
        payment: normalizePayment(getString(dashboard.incomingOrder.payment, 'cashless')),
      }
    }

    return null
  }, [dashboard, orderId, orders])

  const isActive = activeOrderId === orderId
  const actionLabel = ACTIVE_STAGE_ACTION_LABEL[stage]
  const courierName = dashboard?.courier ? `${dashboard.courier.name} ${dashboard.courier.lastName}`.trim() : 'Ivan Petrov'

  const handleAdvance = () => {
    const completed = advanceStage()
    if (completed) {
      navigation.goBack()
    }
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
            <View style={styles.pickupPill}>
              <Text style={styles.pickupPillText}>PICKUP</Text>
            </View>
            <Text style={styles.pickupDistanceText}>250m away</Text>
            <View style={styles.pickupStoreIconWrap}>
              <Ionicons name="storefront-outline" size={16} color="#ff9069" />
            </View>
          </View>
          <Text style={styles.pickupClient}>{order.client}</Text>
          <Text style={styles.pickupAddress}>{order.pickupAddress}</Text>
        </View>

        <View style={styles.authRow}>
          <View style={styles.authCardPrimary}>
            <Text style={styles.authLabel}>ORDER AUTHENTICATION</Text>
            <Text style={styles.authCode}>{order.pickupCode}</Text>
            <Text style={styles.authCodeHint}>pickup code</Text>
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
          <View style={styles.courierTopRow}>
            <View style={styles.courierInfoWrap}>
              <View style={styles.courierAvatar}>
                <Ionicons name="person" size={18} color="#f2f2f5" />
              </View>
              <View>
                <Text style={styles.courierName}>{courierName}</Text>
                <Text style={styles.courierPhone}>{order.clientPhone}</Text>
              </View>
            </View>
            <View style={styles.courierActions}>
              <Pressable style={styles.courierActionBtn}>
                <Ionicons name="call-outline" size={16} color="#ff9069" />
              </Pressable>
              <Pressable style={styles.courierActionBtn}>
                <Ionicons name="chatbox-outline" size={16} color="#ff9069" />
              </Pressable>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.routeAddressWrap}>
              <Ionicons name="location-outline" size={17} color="#fc8f3c" />
              <View>
                <Text style={styles.routeAddressTitle}>{order.deliveryAddress}</Text>
                <Text style={styles.routeAddressHint}>Entrance 2, floor 5</Text>
              </View>
            </View>
            <Pressable style={styles.openRouteBtn}>
              <Ionicons name="navigate" size={12} color="#fc8f3c" />
              <Text style={styles.openRouteText}>Open route</Text>
            </Pressable>
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="megaphone-outline" size={14} color="#fc8f3c" />
            <Text style={styles.noteText}>"Call 5 minutes before arrival"</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>PACKAGE</Text>
            <View style={styles.metaTitleRow}>
              <Ionicons name="cube-outline" size={16} color="#ff9069" />
              <Text style={styles.metaTitle}>{order.parcelsCount} package</Text>
            </View>
            <Text style={styles.metaHint}>Standard Parcel · under 5kg</Text>
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

        <Pressable style={styles.cancelBtn} onPress={() => void cancelActiveOrder()}>
          <Ionicons name="close-circle-outline" size={18} color="#ff716c" />
          <Text style={styles.cancelBtnText}>Cancel order</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.bottomActionWrap, { paddingBottom: insets.bottom + 8 }]}>
        {isActive ? (
          <Pressable style={styles.bottomActionBtn} onPress={handleAdvance}>
            <Text style={styles.bottomActionText}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.bottomActionBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.bottomActionText}>Back</Text>
          </Pressable>
        )}
      </View>
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
})
