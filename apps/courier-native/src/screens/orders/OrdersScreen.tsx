import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import type { CourierOrder } from '@swiftdeliver/core'
import { SCREEN_IDS } from '../../constants/screenIds'
import { fetchOrdersFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { Screen } from '../../ui/Screen'
import { AppText } from '../../ui/primitives'

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  pickup: 'To pickup',
  delivery: 'In transit',
  done: 'Done',
  cancelled: 'Cancelled',
}

const C = {
  activeCard: '#1a1917',
  historyCard: '#141311',
  badgeActiveBg: 'rgba(205,94,61,0.12)',
  badgeActiveBorder: 'rgba(205,94,61,0.25)',
  badgedoneBg: '#201f1d',
  spineBg: 'rgba(255,255,255,0.08)',
  spineActive: appTheme.colors.primary,
}

function formatCreatedAt(value: unknown): string {
  if (typeof value !== 'string') return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate().toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${month} ${day}, ${hh}:${mm}`
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.sectionDivider} />
    </View>
  )
}

function ActiveOrderCard({ item, onOpen }: { item: CourierOrder; onOpen: (id: string) => void }) {
  const statusLabel = STATUS_LABEL[item.status] ?? item.status

  return (
    <View style={styles.activeCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.activeBadge}>
          <AppText style={styles.activeBadgeText}>{statusLabel.toUpperCase()}</AppText>
        </View>
        <AppText style={styles.activeEarnings}>
          +{item.earnings.toLocaleString('ru-RU')} ₸
        </AppText>
      </View>

      <AppText style={styles.activeClientName}>{item.client}</AppText>

      <View style={styles.spineWrapper}>
        {/* Left column: dots + line */}
        <View style={styles.spineColumn}>
          <View style={[styles.spineDot, styles.spineDotActive]} />
          <View style={styles.spineLineSegment} />
          <View style={[styles.spineDot, styles.spineDotInactive]} />
        </View>

        {/* Right column: addresses */}
        <View style={styles.spineAddresses}>
          <View>
            <AppText style={styles.spineLabel}>PICKUP</AppText>
            <AppText style={styles.spineAddress}>{item.pickupAddress}</AppText>
          </View>
          <View style={styles.spineDeliveryBlock}>
            <AppText style={styles.spineLabel}>DELIVERY</AppText>
            <AppText style={styles.spineAddress}>{item.deliveryAddress}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.activeActions}>
        <Pressable
          style={({ pressed }) => [styles.detailsBtn, pressed && { opacity: 0.82 }]}
          onPress={() => onOpen(item.id)}
        >
          <AppText style={styles.detailsBtnText}>Details</AppText>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.82 }]}>
          <Ionicons name="navigate-outline" size={20} color={appTheme.colors.text} />
        </Pressable>
      </View>
    </View>
  )
}

function HistoryCard({ item, onOpen }: { item: CourierOrder; onOpen: (id: string) => void }) {
  const statusLabel = STATUS_LABEL[item.status] ?? item.status
  const dateStr = formatCreatedAt(item.createdAt)
  const distance = typeof item.distance === 'string' ? item.distance : ''

  return (
    <Pressable
      style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.85 }]}
      onPress={() => onOpen(item.id)}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.doneBadge}>
          <AppText style={styles.doneBadgeText}>{statusLabel.toUpperCase()}</AppText>
        </View>
        <AppText style={styles.historyEarnings}>
          +{item.earnings.toLocaleString('ru-RU')} ₸
        </AppText>
      </View>

      <AppText style={styles.historyClientName}>{item.client}</AppText>

      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={1}>
          {item.pickupAddress}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={12}
          color={appTheme.colors.textMuted}
          style={styles.addressArrow}
        />
        <Text style={styles.addressText} numberOfLines={1}>
          {item.deliveryAddress}
        </Text>
      </View>

      <View style={styles.historyMeta}>
        {dateStr ? <AppText style={styles.metaText}>{dateStr}</AppText> : null}
        {distance ? <AppText style={styles.metaText}>{distance}</AppText> : null}
      </View>
    </Pressable>
  )
}

export function OrdersScreen() {
  const navigation = useNavigation<any>()
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersFromCore,
  })

  const { activeOrders, historyOrders, activeCount } = useMemo(() => {
    const active = data.filter(o => o.status === 'pickup' || o.status === 'delivery' || o.status === 'new')
    const history = data.filter(o => o.status === 'done' || o.status === 'cancelled')
    return { activeOrders: active, historyOrders: history, activeCount: active.length }
  }, [data])

  const openDetails = (orderId: string) => {
    navigation.navigate(SCREEN_IDS.ORDER_DETAIL, { orderId })
  }

  return (
    <Screen title="Orders" subtitle={isLoading ? 'Loading...' : `${activeCount} active`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeOrders.length > 0 && (
          <>
            <SectionHeader title="Active Journey" />
            {activeOrders.map(item => (
              <View key={item.id} style={styles.cardGap}>
                <ActiveOrderCard item={item} onOpen={openDetails} />
              </View>
            ))}
          </>
        )}

        {historyOrders.length > 0 && (
          <View style={activeOrders.length > 0 ? styles.historySection : undefined}>
            <SectionHeader title="Recent History" />
            {historyOrders.map(item => (
              <View key={item.id} style={styles.cardGap}>
                <HistoryCard item={item} onOpen={openDetails} />
              </View>
            ))}
          </View>
        )}

        {data.length === 0 && (
          <AppText variant="subtitle" style={styles.empty}>
            {isLoading ? 'Loading...' : 'No orders yet'}
          </AppText>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  cardGap: {
    marginBottom: appTheme.spacing.sm,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: appTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appTheme.colors.text,
  },
  sectionDivider: {
    flex: 1,
    height: 2,
    marginLeft: appTheme.spacing.md,
    marginBottom: 3,
    backgroundColor: appTheme.colors.border,
    opacity: 0.35,
  },
  historySection: {
    marginTop: appTheme.spacing.xl,
  },

  // Active card
  activeCard: {
    backgroundColor: C.activeCard,
    borderRadius: 16,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: appTheme.spacing.md,
  },
  activeBadge: {
    backgroundColor: C.badgeActiveBg,
    borderWidth: 1,
    borderColor: C.badgeActiveBorder,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: appTheme.colors.primary,
  },
  activeEarnings: {
    fontSize: 18,
    fontWeight: '800',
    color: appTheme.colors.primary,
  },
  activeClientName: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.colors.text,
    marginBottom: appTheme.spacing.md,
  },

  // Spine
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
    borderColor: C.activeCard,
  },
  spineDotInactive: {
    backgroundColor: appTheme.colors.border,
    borderColor: C.activeCard,
  },
  spineLineSegment: {
    flex: 1,
    width: 1,
    backgroundColor: C.spineActive,
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

  // Active card actions
  activeActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: appTheme.spacing.md,
    marginTop: appTheme.spacing.xs,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 99,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  navBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#272623',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History card
  historyCard: {
    backgroundColor: C.historyCard,
    borderRadius: 16,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: appTheme.spacing.xs,
  },
  doneBadge: {
    backgroundColor: C.badgedoneBg,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: appTheme.colors.textMuted,
  },
  historyEarnings: {
    fontSize: 17,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
  },
  historyClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  addressText: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    flexShrink: 1,
  },
  addressArrow: {
    marginHorizontal: 4,
    flexShrink: 0,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: appTheme.spacing.xs,
    marginTop: appTheme.spacing.xxs,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: appTheme.colors.border,
    textTransform: 'uppercase',
  },

  empty: {
    textAlign: 'center',
    marginTop: 28,
  },
})
