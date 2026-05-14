import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { listUserOrders, type UserOrder } from '../../data/ordersApi'

type UserOrdersScreenProps = {
  accessToken?: string
  supplementalOrders?: UserOrder[]
  reloadKey?: number
  onUnauthorized?: () => void
  onOrderPress?: (order: UserOrder) => void
  onHomePress?: () => void
  onCartPress?: () => void
  onProfilePress?: () => void
}

type OrderTab = 'active' | 'past'

const ACTIVE_ORDER_STATUSES = new Set([
  'NEW',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERY_CONFIRMATION_PENDING',
])

const STATUS_META: Record<
  string,
  {
    label: string
    color: string
    badgeText: string
    progress: number
    progressColor: string
  }
> = {
  NEW: {
    label: 'New',
    color: '#6B9CFF',
    badgeText: '#B85A3A',
    progress: 10,
    progressColor: '#6B9CFF',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: '#7FD48B',
    badgeText: '#B85A3A',
    progress: 22,
    progressColor: '#7FD48B',
  },
  PREPARING: {
    label: 'Preparing',
    color: '#FF7A59',
    badgeText: '#B85A3A',
    progress: 34,
    progressColor: '#FF7A59',
  },
  READY: {
    label: 'Ready',
    color: '#F1B16A',
    badgeText: '#B85A3A',
    progress: 48,
    progressColor: '#F1B16A',
  },
  ASSIGNED: {
    label: 'Assigned',
    color: '#6B9CFF',
    badgeText: '#B85A3A',
    progress: 58,
    progressColor: '#6B9CFF',
  },
  PICKED_UP: {
    label: 'Picked up',
    color: '#8FD49A',
    badgeText: '#B85A3A',
    progress: 76,
    progressColor: '#8FD49A',
  },
  IN_TRANSIT: {
    label: 'On the way',
    color: '#FF7A59',
    badgeText: '#B85A3A',
    progress: 88,
    progressColor: '#FF7A59',
  },
  DELIVERY_CONFIRMATION_PENDING: {
    label: 'Confirming',
    color: '#FF7A59',
    badgeText: '#B85A3A',
    progress: 96,
    progressColor: '#FF7A59',
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#7FD48B',
    badgeText: '#7F716B',
    progress: 100,
    progressColor: '#7FD48B',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#B0B6BC',
    badgeText: '#7F716B',
    progress: 100,
    progressColor: '#757A80',
  },
  REJECTED: {
    label: 'Rejected',
    color: '#B0B6BC',
    badgeText: '#7F716B',
    progress: 100,
    progressColor: '#757A80',
  },
}

function resolveOrderIcon(order: UserOrder, variant: 'active' | 'past' = 'active') {
  if (variant === 'past' && order.status === 'DELIVERED') {
    return <Feather name="check-circle" size={20} color="#58423C" />
  }

  if (variant === 'past' && ['CANCELLED', 'REJECTED'].includes(order.status)) {
    return <Feather name="x-circle" size={20} color="#58423C" />
  }

  if (order.serviceType === 'FOOD') {
    return <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FF7A59" />
  }

  if (order.serviceType === 'EXPRESS') {
    return <Feather name="zap" size={19} color="#6B9CFF" />
  }

  return <MaterialCommunityIcons name="truck-delivery-outline" size={21} color="#6B9CFF" />
}

function isActiveOrder(order: UserOrder) {
  return ACTIVE_ORDER_STATUSES.has(order.status)
}

function formatOrderTitle(order: UserOrder) {
  const pickupName = order.pickupInfo?.name?.trim()
  if (order.serviceType === 'FOOD' && pickupName) {
    return pickupName
  }

  if (pickupName && !['sender', 'pickup', 'courier'].includes(pickupName.toLowerCase())) {
    return pickupName
  }

  if (order.serviceType === 'EXPRESS') {
    return 'Express Parcel'
  }

  if (order.serviceType === 'SCHEDULED') {
    return 'Scheduled Parcel'
  }

  if (order.serviceType && order.serviceType !== 'FOOD') {
    return 'Parcel Delivery'
  }

  const recipientName = order.recipientInfo?.name?.trim()
  if (recipientName) return recipientName

  return 'Sender'
}

function formatOrderSubtitle(order: UserOrder) {
  if (order.serviceType === 'FOOD') {
    return 'Food Delivery'
  }

  return `Tracking: ${formatOrderCode(order.orderId)}`
}

function formatAmount(order: UserOrder) {
  const value = order.totalAmount
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0

  if (order.serviceType === 'FOOD') {
    return `$${safeValue.toFixed(2)}`
  }

  return `${safeValue.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 2,
    maximumFractionDigits: 2,
  })} KZT`
}

function formatShortDate(value?: string) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatOrderCode(orderId: string) {
  return `#${orderId.slice(0, 8)}`
}

function formatTopPill(order: UserOrder) {
  switch (order.status) {
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return 'ON THE WAY'
    case 'DELIVERY_CONFIRMATION_PENDING':
      return 'ARRIVING'
    case 'ASSIGNED':
      return 'COURIER'
    case 'PREPARING':
      return 'PREPARING'
    case 'READY':
      return 'READY'
    case 'ACCEPTED':
      return order.serviceType === 'FOOD' ? 'COOKING' : 'IN PROGRESS'
    case 'NEW':
      return order.serviceType === 'SCHEDULED' ? 'SCHEDULED' : 'NEW'
    default:
      return (STATUS_META[order.status]?.label ?? 'ACTIVE').toUpperCase()
  }
}

function getTopPillStyle(order: UserOrder) {
  if (['IN_TRANSIT', 'PICKED_UP', 'DELIVERY_CONFIRMATION_PENDING'].includes(order.status)) {
    return {
      backgroundColor: 'rgba(174, 198, 255, 0.20)',
      color: '#003275',
    }
  }

  if (order.status === 'DELIVERED') {
    return {
      backgroundColor: 'rgba(127, 212, 139, 0.18)',
      color: '#446744',
    }
  }

  return {
    backgroundColor: '#E6E8EA',
    color: '#58423C',
  }
}

function getActionButtonStyle(order: UserOrder) {
  if (order.serviceType === 'FOOD') {
    return {
      backgroundColor: '#FF7A59',
      color: '#FFFFFF',
      shadowColor: '#A7391E',
    }
  }

  return {
    backgroundColor: '#6B9CFF',
    color: '#003275',
    shadowColor: '#4B77D8',
  }
}

function formatPastSubtitle(order: UserOrder) {
  const status = STATUS_META[order.status] ?? STATUS_META.NEW
  return `${status.label} • ${formatShortDate(order.updatedAt ?? order.createdAt)}`
}

function formatPastTrailing(order: UserOrder) {
  if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
    return formatAmount(order)
  }

  return formatOrderCode(order.orderId)
}

function TabBarItem({
  active,
  icon,
  label,
}: {
  active?: boolean
  icon: ReactNode
  label: string
}) {
  return (
    <View style={styles.navItem}>
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>{icon}</View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </View>
  )
}

function ActiveOrderCard({
  order,
  onPress,
}: {
  order: UserOrder
  onPress?: (order: UserOrder) => void
}) {
  const status = STATUS_META[order.status] ?? STATUS_META.NEW
  const topPillStyle = getTopPillStyle(order)
  const actionButtonStyle = getActionButtonStyle(order)

  return (
    <View style={styles.activeOrderCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardIdentityRow}>
          <View style={styles.cardIconWrap}>{resolveOrderIcon(order, 'active')}</View>
          <View style={styles.cardIdentityCopy}>
            <Text style={styles.cardTitle}>{formatOrderTitle(order)}</Text>
            <Text style={styles.cardSubtitle}>{formatOrderSubtitle(order)}</Text>
          </View>
        </View>

        <View style={[styles.topPill, { backgroundColor: topPillStyle.backgroundColor }]}>
          <Text style={[styles.topPillText, { color: topPillStyle.color }]}>
            {formatTopPill(order)}
          </Text>
        </View>
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusPanelRow}>
          <Text style={styles.statusPanelLabel}>Status</Text>
          <Text style={[styles.statusPanelValue, { color: status.color }]}>{status.label}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${status.progress}%`, backgroundColor: status.progressColor },
            ]}
          />
        </View>
      </View>

      <Pressable
        onPress={onPress ? () => onPress(order) : undefined}
        style={({ pressed }) => [
          styles.primaryActionButton,
          {
            backgroundColor: actionButtonStyle.backgroundColor,
            shadowColor: actionButtonStyle.shadowColor,
          },
          pressed && styles.primaryActionButtonPressed,
        ]}
      >
        <Text style={[styles.primaryActionButtonText, { color: actionButtonStyle.color }]}>
          Order Details
        </Text>
      </Pressable>
    </View>
  )
}

function PastOrderCard({
  order,
  onPress,
}: {
  order: UserOrder
  onPress?: (order: UserOrder) => void
}) {
  return (
    <View style={styles.pastOrderCard}>
      <View style={styles.pastTopRow}>
        <View style={styles.pastIdentityRow}>
          <View style={styles.pastIconWrap}>{resolveOrderIcon(order, 'past')}</View>
          <View style={styles.pastIdentityCopy}>
            <Text style={styles.pastTitle}>{formatOrderTitle(order)}</Text>
            <Text style={styles.pastSubtitle}>{formatPastSubtitle(order)}</Text>
          </View>
        </View>

        <Text style={styles.pastAmountText}>{formatPastTrailing(order)}</Text>
      </View>

      <Pressable
        onPress={onPress ? () => onPress(order) : undefined}
        style={({ pressed }) => [
          styles.secondaryActionButton,
          pressed && styles.secondaryActionButtonPressed,
        ]}
      >
        <Text style={styles.secondaryActionButtonText}>Order Details</Text>
      </Pressable>
    </View>
  )
}

export function UserOrdersScreen({
  accessToken,
  supplementalOrders = [],
  reloadKey = 0,
  onUnauthorized,
  onOrderPress,
  onHomePress,
  onCartPress,
  onProfilePress,
}: UserOrdersScreenProps) {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<OrderTab>('active')
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!accessToken) {
        setOrders([])
        setError('Missing access token')
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      if (mode === 'refresh') {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const response = await listUserOrders(accessToken)

      if (!response.ok) {
        if (response.error.status === 401) {
          setIsLoading(false)
          setIsRefreshing(false)
          onUnauthorized?.()
          return
        }

        setOrders([])
        setError(response.error.message)
      } else if (!response.data.success) {
        const message = response.data.error?.message ?? 'Failed to load orders'
        if (response.data.error?.code === 'UNAUTHORIZED') {
          setIsLoading(false)
          setIsRefreshing(false)
          onUnauthorized?.()
          return
        }

        setOrders([])
        setError(message)
      } else {
        setOrders(response.data.data?.orders ?? [])
        setError('')
      }

      setIsLoading(false)
      setIsRefreshing(false)
    },
    [accessToken, onUnauthorized],
  )

  useEffect(() => {
    void loadOrders('initial')
  }, [loadOrders, reloadKey])

  const mergedOrders = useMemo(() => {
    const mergedById = new Map<string, UserOrder>()

    orders.forEach(order => {
      mergedById.set(order.orderId, order)
    })

    supplementalOrders.forEach(order => {
      mergedById.set(order.orderId, order)
    })

    return Array.from(mergedById.values()).sort((left, right) => {
      const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
      const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime()
      return rightTime - leftTime
    })
  }, [orders, supplementalOrders])

  const { activeOrders, pastOrders } = useMemo(() => {
    const nextActive = mergedOrders.filter(isActiveOrder)
    const nextPast = mergedOrders.filter(order => !isActiveOrder(order))
    return { activeOrders: nextActive, pastOrders: nextPast }
  }, [mergedOrders])

  const subtitle = isLoading
    ? 'Loading orders...'
    : `${activeTab === 'active' ? activeOrders.length : pastOrders.length} ${activeTab}`
  const recentPastOrders = pastOrders.slice(0, 2)

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadOrders('refresh')} />
        }
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
      >
        <View style={styles.segment}>
          <Pressable
            onPress={() => setActiveTab('active')}
            style={[styles.segmentButton, activeTab === 'active' && styles.segmentButtonActive]}
          >
            <Text
              style={[styles.segmentButtonText, activeTab === 'active' && styles.segmentButtonTextActive]}
            >
              Active
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('past')}
            style={[styles.segmentButton, activeTab === 'past' && styles.segmentButtonActive]}
          >
            <Text
              style={[styles.segmentButtonText, activeTab === 'past' && styles.segmentButtonTextActive]}
            >
              Past
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#D1502C" />
            <Text style={styles.stateText}>Loading your orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Orders are unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => void loadOrders('initial')} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {activeTab === 'active' ? (
              <>
                {activeOrders.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateTitle}>No active orders</Text>
                    <Text style={styles.stateText}>New backend orders will appear here.</Text>
                  </View>
                ) : (
                  <View style={styles.ordersList}>
                    {activeOrders.map(order => (
                      <ActiveOrderCard
                        key={order.orderId}
                        order={order}
                        onPress={onOrderPress}
                      />
                    ))}
                  </View>
                )}

                {recentPastOrders.length ? (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Past</Text>
                    </View>
                    <View style={styles.ordersList}>
                      {recentPastOrders.map(order => (
                        <PastOrderCard
                          key={order.orderId}
                          order={order}
                          onPress={onOrderPress}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            ) : pastOrders.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No past orders yet</Text>
                <Text style={styles.stateText}>Delivered or cancelled orders will appear here.</Text>
              </View>
            ) : (
              <View style={styles.ordersList}>
                {pastOrders.map(order => (
                  <PastOrderCard
                    key={order.orderId}
                    order={order}
                    onPress={onOrderPress}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <Pressable onPress={onHomePress}>
          <TabBarItem icon={<Ionicons name="home" size={22} color="#191919" />} label="Home" />
        </Pressable>

        <TabBarItem
          active
          icon={<Feather name="box" size={20} color="#FFFFFF" />}
          label="Orders"
        />

        <Pressable onPress={onCartPress}>
          <TabBarItem
            icon={<Feather name="shopping-cart" size={22} color="#191919" />}
            label="Cart"
          />
        </Pressable>

        <Pressable onPress={onProfilePress}>
          <TabBarItem icon={<Feather name="user" size={22} color="#191919" />} label="Profile" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    color: '#191919',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#8D776F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAED',
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentButtonText: {
    color: '#5B4941',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: '#191919',
    fontWeight: '800',
  },
  ordersList: {
    gap: 16,
  },
  activeOrderCard: {
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 16,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIdentityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIdentityCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: '#191C1E',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  topPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  topPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusPanel: {
    backgroundColor: '#F2F4F6',
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  statusPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusPanelLabel: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  statusPanelValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E6E8EA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  primaryActionButton: {
    alignSelf: 'stretch',
    borderRadius: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  primaryActionButtonPressed: {
    opacity: 0.92,
  },
  primaryActionButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: '#191C1E',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  pastOrderCard: {
    borderRadius: 32,
    backgroundColor: '#F2F4F6',
    padding: 20,
    gap: 16,
  },
  pastTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  pastIdentityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pastIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastIdentityCopy: {
    flex: 1,
    gap: 2,
  },
  pastTitle: {
    color: '#191C1E',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  pastSubtitle: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  pastAmountText: {
    color: '#191C1E',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  secondaryActionButton: {
    alignSelf: 'stretch',
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  secondaryActionButtonPressed: {
    opacity: 0.94,
  },
  secondaryActionButtonText: {
    color: '#A7391E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  stateCard: {
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 10,
  },
  stateTitle: {
    color: '#191919',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: '#5B4941',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 2,
    height: 42,
    minWidth: 108,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1502C',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  navIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#D1502C',
  },
  navLabel: {
    color: '#191919',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#A53A1E',
    fontWeight: '800',
  },
})
