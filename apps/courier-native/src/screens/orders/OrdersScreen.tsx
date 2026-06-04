import { useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { SCREEN_IDS } from '../../constants/screenIds'
import { appTheme } from '../../theme/appTheme'
import { Screen } from '../../ui/Screen'
import { AppText } from '../../ui/primitives'
import { useShiftStore } from '../../store/shiftStore'
import { useAuthStore } from '../../store/authStore'
import type { AssignmentResponse, OrderResponse } from '../../data/logisticsApi'

type TabType = 'offers' | 'active' | 'completed'

function AssignmentCard({
  item,
  orderDetails,
  onOpen,
  courierType,
}: {
  item: AssignmentResponse
  orderDetails?: OrderResponse
  onOpen: (assignmentId: string, orderId: string) => void
  courierType?: string
}) {
  const fetchOrderDetails = useShiftStore(state => state.fetchOrderDetails)

  useEffect(() => {
    if (!orderDetails) {
      void fetchOrderDetails(item.orderId)
    }
  }, [item.orderId, orderDetails, fetchOrderDetails])

  const statusLabel = item.assignmentStatus
  const shortId = item.id.slice(0, 8)
  const clientName = orderDetails?.recipientInfo?.name || 'Customer'
  const earnings = orderDetails?.totalAmount ? `${orderDetails.totalAmount} ₸` : '... ₸'
  const pickup = orderDetails?.pickupAddress?.street || 'Loading pickup address...'
  const delivery = orderDetails?.deliveryAddress?.street || 'Loading delivery address...'

  const isOffer = item.assignmentStatus === 'PENDING'
  const isContractor = courierType === 'CONTRACTOR'

  return (
    <Pressable
      style={({ pressed }) => [
        styles.assignmentCard,
        isOffer ? styles.offerCard : styles.standardCard,
        pressed && { opacity: 0.85 }
      ]}
      onPress={() => onOpen(item.id, item.orderId)}
    >
      <View style={styles.cardTopRow}>
        <View style={[
          styles.statusBadge,
          statusLabel === 'PENDING' ? styles.statusPending :
          ['ASSIGNED', 'ACCEPTED'].includes(statusLabel) ? styles.statusAssigned :
          ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(statusLabel) ? styles.statusActive :
          statusLabel === 'DELIVERED' ? styles.statusDelivered :
          styles.statusCancelled
        ]}>
          <AppText style={styles.badgeText}>{statusLabel}</AppText>
        </View>
        <AppText style={styles.earningsText}>{earnings}</AppText>
      </View>

      <AppText style={styles.clientName}>{clientName}</AppText>
      
      <View style={styles.idRow}>
        <AppText style={styles.idText}>Assign: #{shortId}</AppText>
        <AppText style={styles.idText}>Order: #{item.orderId.slice(0, 8)}</AppText>
      </View>

      <View style={styles.spineWrapper}>
        <View style={styles.spineColumn}>
          <View style={[styles.spineDot, styles.spineDotActive]} />
          <View style={styles.spineLineSegment} />
          <View style={[styles.spineDot, styles.spineDotInactive]} />
        </View>

        <View style={styles.spineAddresses}>
          <View>
            <AppText style={styles.spineLabel}>PICKUP</AppText>
            <AppText style={styles.spineAddress}>{pickup}</AppText>
          </View>
          <View style={styles.spineDeliveryBlock}>
            <AppText style={styles.spineLabel}>DELIVERY</AppText>
            <AppText style={styles.spineAddress}>{delivery}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.actionRow}>
          {isOffer && isContractor ? (
            <View style={styles.offerBadge}>
              <Ionicons name="flash" size={12} color="#ee8f5e" />
              <AppText style={styles.offerBadgeText}>CONTRACT OFFER</AppText>
            </View>
          ) : null}
          <Pressable
            style={styles.openDetailsBtn}
            onPress={() => onOpen(item.id, item.orderId)}
          >
            <AppText style={styles.openDetailsBtnText}>
              {isOffer && isContractor ? 'Open Offer' : 'Details'}
            </AppText>
            <Ionicons name="chevron-forward" size={14} color="#2b1b13" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

export function OrdersScreen() {
  const navigation = useNavigation<any>()
  const courierProfile = useAuthStore(state => state.courierProfile)
  const courierType = courierProfile?.courierType || 'EMPLOYEE'

  const {
    pendingAssignments,
    activeAssignments,
    completedAssignments,
    loading,
    refreshing,
    error,
    ordersCache,
    loadAssignments,
    refreshAssignments,
  } = useShiftStore()

  const [activeTab, setActiveTab] = useState<TabType>('offers')

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  const visibleList = useMemo(() => {
    if (activeTab === 'offers') return pendingAssignments
    if (activeTab === 'active') return activeAssignments
    return completedAssignments
  }, [activeTab, pendingAssignments, activeAssignments, completedAssignments])

  const openDetails = (assignmentId: string, orderId: string) => {
    navigation.navigate(SCREEN_IDS.ORDER_DETAIL, { assignmentId, orderId })
  }

  const emptyLabel =
    activeTab === 'offers' ? 'No pending offers' :
    activeTab === 'active' ? 'No active deliveries' :
    'No completed deliveries'

  return (
    <Screen title="Inbox" subtitle={loading ? 'Loading...' : `${visibleList.length} items`}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {(['offers', 'active', 'completed'] as const).map(tab => {
            const count =
              tab === 'offers' ? pendingAssignments.length :
              tab === 'active' ? activeAssignments.length :
              completedAssignments.length

            const isActive = activeTab === tab

            return (
              <Pressable
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab as TabType)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.toUpperCase()}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#ef706a" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void loadAssignments()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshAssignments()}
              tintColor={appTheme.colors.primary}
              colors={[appTheme.colors.primary]}
            />
          }
        >
          {loading && visibleList.length === 0 ? (
            <ActivityIndicator size="large" color={appTheme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {visibleList.map(item => (
                <AssignmentCard
                  key={item.id}
                  item={item}
                  orderDetails={ordersCache[item.orderId]}
                  onOpen={openDetails}
                  courierType={courierType}
                />
              ))}

              {!loading && visibleList.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Ionicons name="cube-outline" size={48} color="#44414a" style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>{emptyLabel}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#16151a',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#26242c',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#27242c',
    borderWidth: 1,
    borderColor: '#37343e',
  },
  tabButtonText: {
    color: '#908d96',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: appTheme.colors.primary,
  },
  tabBadge: {
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: appTheme.colors.primary,
  },
  tabBadgeInactive: {
    backgroundColor: '#2b2930',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#908d96',
  },
  tabBadgeTextActive: {
    color: '#2d1b13',
  },
  assignmentCard: {
    backgroundColor: '#16151a',
    borderRadius: 16,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    marginBottom: appTheme.spacing.sm,
  },
  offerCard: {
    borderColor: 'rgba(238, 143, 94, 0.3)',
    backgroundColor: '#1b1716',
  },
  standardCard: {
    borderColor: '#26242c',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(238, 143, 94, 0.12)',
    borderColor: 'rgba(238, 143, 94, 0.25)',
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
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#eceef6',
  },
  earningsText: {
    fontSize: 18,
    fontWeight: '800',
    color: appTheme.colors.primary,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  idText: {
    fontSize: 11,
    color: appTheme.colors.textMuted,
    fontFamily: Platform.select({ ios: 'CourierNewPSMT', android: 'monospace', default: 'monospace' }),
  },
  spineWrapper: {
    flexDirection: 'row',
    marginBottom: appTheme.spacing.md,
  },
  spineColumn: {
    width: 16,
    alignItems: 'center',
    marginRight: 14,
    paddingTop: 2,
  },
  spineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  spineDotActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: '#16151a',
  },
  spineDotInactive: {
    backgroundColor: appTheme.colors.border,
    borderColor: '#16151a',
  },
  spineLineSegment: {
    flex: 1,
    width: 1,
    backgroundColor: appTheme.colors.primary,
    opacity: 0.4,
    marginVertical: 2,
  },
  spineAddresses: {
    flex: 1,
  },
  spineLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: appTheme.colors.textMuted,
    marginBottom: 2,
  },
  spineAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.colors.text,
  },
  spineDeliveryBlock: {
    marginTop: 18,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 143, 94, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ee8f5e',
  },
  openDetailsBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  openDetailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2b1b13',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    opacity: 0.35,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 112, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 112, 106, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#ef706a',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#ef706a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#2d1b13',
    fontSize: 12,
    fontWeight: '700',
  },
})
