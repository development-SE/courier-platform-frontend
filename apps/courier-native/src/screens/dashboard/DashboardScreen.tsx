import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, Image } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SCREEN_IDS } from '../../constants/screenIds'
import { appTheme } from '../../theme/appTheme'
import { useDashboardModel } from './useDashboardModel'
import { useUserLocation } from '../../hooks/useUserLocation'

const STATUS_LABEL: Record<'offline' | 'online' | 'busy', string> = {
  offline: 'Offline',
  online: 'Online',
  busy: 'In order',
}

const ACTIVE_STAGE_ACTION_LABEL: Record<'arrived' | 'pickedUp' | 'onWay' | 'delivered', string> = {
  arrived: 'Arrived at Pickup',
  pickedUp: 'Picked up',
  onWay: 'In transit',
  delivered: 'Delivered',
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#13161f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f677a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#10141f' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#202837' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#171e2b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3447' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1b2433' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1727' }] },
]

type MetricTileProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
}

function MetricTile({ icon, label, value }: MetricTileProps) {
  return (
    <View style={styles.metricTile}>
      <Ionicons name={icon} size={14} color={appTheme.colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

function MainButton({
  title,
  disabled,
  onPress,
}: {
  title: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.mainButton, disabled ? styles.mainButtonDisabled : null]}>
      <Text style={styles.mainButtonText}>{title}</Text>
      <Ionicons color="#2d1b13" name="flash-outline" size={18} />
    </Pressable>
  )
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function DashboardScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const mapRef = useRef<MapView>(null)
  const animatedIndex = useSharedValue(0)
  const [sheetIndex, setSheetIndex] = useState(0)

  const {
    courier,
    incomingOrder,
    activeOrder,
    status,
    activating,
    hasActiveOrder,
    showIncoming,
    mapPosition,
    stage,
    stageMeta,
    toggleOnline,
    acceptIncoming,
    skipIncoming,
    advanceStage,
    cancelActiveOrder,
  } = useDashboardModel()

  // Real-time location tracking
  const { latitude: userLat, longitude: userLng } = useUserLocation()

  // Use real location if available, otherwise fallback to map position
  const [longitude, latitude] = [userLng ?? mapPosition[0], userLat ?? mapPosition[1]]

  const region = useMemo(
    () => ({
      latitude: latitude || mapPosition[1],
      longitude: longitude || mapPosition[0],
      latitudeDelta: 0.014,
      longitudeDelta: 0.014,
    }),
    [latitude, longitude, mapPosition],
  )

  const ordersCount = hasActiveOrder ? '1' : '0'
  const distanceValue = activeOrder?.distance ?? incomingOrder?.distance ?? '0 km'
  const earningsValue = `${activeOrder?.earnings ?? incomingOrder?.earnings ?? 0} KZT`

  const statusHelper =
    status === 'offline'
      ? 'Go online to start receiving orders'
      : status === 'online'
        ? 'Waiting for new orders nearby'
        : `Order #${activeOrder?.id ?? '-'} in progress`

  const mainCtaTitle = hasActiveOrder
    ? 'ORDER ACTIVE'
    : activating
      ? 'SWITCHING'
      : status === 'offline'
        ? 'GO ONLINE'
        : 'END SHIFT'

  const openOrderDetails = () => {
    if (!activeOrder?.id) return
    navigation.navigate(SCREEN_IDS.ORDER_DETAIL, { orderId: activeOrder.id })
  }

  const incomingDistance = incomingOrder?.distance ?? '0 km'
  const incomingEta = `${incomingOrder?.estimatedMin ?? 0} min`
  const incomingItems = `${incomingOrder?.pointsCount ?? incomingOrder?.parcelsCount ?? 0} items`
  const incomingVisible = Boolean(showIncoming && incomingOrder && !hasActiveOrder)
  const showIncomingOverlay = incomingVisible && sheetIndex === 0
  const snapPoints = useMemo(() => {
    if (hasActiveOrder) return [220, 540]
    return [320, 520]
  }, [hasActiveOrder])
  const [renderIncomingOverlay, setRenderIncomingOverlay] = useState(showIncomingOverlay)
  const incomingOverlayProgress = useSharedValue(showIncomingOverlay ? 1 : 0)
  const incomingOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeActionLabel = ACTIVE_STAGE_ACTION_LABEL[stage]
  const courierName = courier ? `${courier.name} ${courier.lastName}`.trim() : 'Courier Support'
  const courierPhone = courier?.phone ?? '+7 777 123 45 67'

  const isExpanded = sheetIndex === 1

  const collapsedActiveAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity: 1 - progress,
      maxHeight: interpolate(progress, [0, 1], [190, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(progress, [0, 1], [0, -10], Extrapolation.CLAMP) }],
      overflow: 'hidden',
    }
  })

  const expandedAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity: progress,
      maxHeight: interpolate(progress, [0, 1], [0, 640], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(progress, [0, 1], [12, 0], Extrapolation.CLAMP) }],
      overflow: 'hidden',
    }
  })

  const expandedFooterAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity: progress,
      maxHeight: interpolate(progress, [0, 1], [0, 280], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(progress, [0, 1], [10, 0], Extrapolation.CLAMP) }],
      overflow: 'hidden',
    }
  })

  const incomingOverlayAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(incomingOverlayProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP)
    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [-14, 0], Extrapolation.CLAMP) },
        { scale: interpolate(progress, [0, 1], [0.98, 1], Extrapolation.CLAMP) },
      ],
    }
  })

  useEffect(() => {
    bottomSheetRef.current?.snapToIndex(hasActiveOrder ? 1 : 0)
  }, [hasActiveOrder])

  useEffect(() => {
    if (!incomingVisible) return
    bottomSheetRef.current?.snapToIndex(0)
  }, [incomingVisible])

  useEffect(() => {
    if (incomingOverlayTimerRef.current) {
      clearTimeout(incomingOverlayTimerRef.current)
      incomingOverlayTimerRef.current = null
    }

    if (showIncomingOverlay) {
      setRenderIncomingOverlay(true)
      incomingOverlayProgress.value = withTiming(1, { duration: 240 })
      return
    }

    incomingOverlayProgress.value = withTiming(0, { duration: 180 })
    incomingOverlayTimerRef.current = setTimeout(() => {
      setRenderIncomingOverlay(false)
      incomingOverlayTimerRef.current = null
    }, 180)
  }, [showIncomingOverlay, incomingOverlayProgress])

  useEffect(
    () => () => {
      if (!incomingOverlayTimerRef.current) return
      clearTimeout(incomingOverlayTimerRef.current)
      incomingOverlayTimerRef.current = null
    },
    [],
  )

  // Animate map to user location when available
  useEffect(() => {
    if (userLat && userLng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      }, 800)
    }
  }, [userLat, userLng])

  return (
    <View style={styles.screen}>
      <MapView 
        ref={mapRef}
        style={StyleSheet.absoluteFill} 
        customMapStyle={DARK_MAP_STYLE} 
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      />

      <View pointerEvents="box-none" style={[styles.topBarContainer, { top: insets.top + 12 }]}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={18} color="#d6d9e5" />
        </Pressable>
      </View>

      {renderIncomingOverlay ? (
        <Animated.View style={[styles.incomingOverlayCard, { top: insets.top + 58 }, incomingOverlayAnimatedStyle]}>
          <View style={styles.incomingTopHead}>
            <Text style={styles.incomingTopTag}>НОВЫЙ ЗАКАЗ</Text>
            <View style={styles.incomingPricePill}>
              <Text style={styles.incomingPriceText}>${incomingOrder?.earnings?.toFixed(2) ?? '0.00'}</Text>
            </View>
          </View>

          <Text style={styles.incomingTopClient}>{incomingOrder?.client ?? 'Order'}</Text>

          <View style={styles.incomingTopMeta}>
            <View style={styles.metaCell}>
              <Ionicons name="git-network-outline" size={18} color="#f3984f" />
              <Text style={styles.metaText}>{incomingDistance}</Text>
            </View>
            <View style={styles.metaCell}>
              <Ionicons name="time-outline" size={18} color="#f3984f" />
              <Text style={styles.metaText}>{incomingEta}</Text>
            </View>
            <View style={styles.metaCell}>
              <Ionicons name="cube-outline" size={18} color="#f3984f" />
              <Text style={styles.metaText}>{incomingItems}</Text>
            </View>
          </View>

          <View style={styles.incomingTopActions}>
            <Pressable onPress={skipIncoming} style={styles.declineButton}>
              <Text style={styles.declineButtonText}>Отклонить</Text>
            </Pressable>
            <Pressable onPress={acceptIncoming} style={styles.acceptTopButton}>
              <Text style={styles.acceptTopButtonText}>Принять</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        animatedIndex={animatedIndex}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableOverDrag={false}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        handleStyle={styles.handleContainer}
        onChange={index => setSheetIndex(index < 0 ? 0 : index)}
      >
        <BottomSheetScrollView
          bounces={false}
          nestedScrollEnabled
          scrollEnabled={hasActiveOrder && isExpanded}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
          contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: insets.bottom + (hasActiveOrder ? 24 : 8) }]}
        >
          <View style={styles.sheetTop}>
            {!hasActiveOrder ? (
              <>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
                </View>
                <Text style={styles.helperText}>{statusHelper}</Text>
              </>
            ) : null}

            {hasActiveOrder && activeOrder ? (
              <Animated.View style={collapsedActiveAnimatedStyle} pointerEvents={isExpanded ? 'none' : 'auto'}>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
                </View>
                <Text style={styles.helperText}>{statusHelper}</Text>
                <View style={styles.activeCompactCard}>
                  <Text numberOfLines={1} style={styles.activeCompactTitle}>{activeOrder.pickupAddress}</Text>
                  <Text style={styles.activeCompactHint}>Order #{activeOrder.id} · {stageMeta.chip}</Text>
                </View>
                <View style={styles.collapsedActionRow}>
                  <Pressable style={styles.collapsedSecondaryButton} onPress={openOrderDetails}>
                    <Text style={styles.collapsedSecondaryText}>Order Details</Text>
                  </Pressable>
                  <Pressable style={styles.collapsedPrimaryButton} onPress={() => void advanceStage()}>
                    <Text style={styles.collapsedPrimaryText}>Arrived at pickup</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}
          </View>

          {!hasActiveOrder ? (
            <View style={styles.idleContent}>
              <View style={styles.metricsRow}>
                <MetricTile icon="receipt-outline" label="ORDERS" value={ordersCount} />
                <MetricTile icon="map-outline" label="DISTANCE" value={distanceValue} />
                <MetricTile icon="reload-outline" label="EARNINGS" value={earningsValue} />
              </View>

              <Pressable style={styles.parkRow} onPress={() => navigation.navigate(SCREEN_IDS.ORDERS)}>
                <View style={styles.parkMain}>
                  <Text style={styles.parkTitle}>{courier?.park ?? 'Oktyabrsky District'}</Text>
                  <Text style={styles.parkHint}>
                    {status === 'offline' ? 'No orders nearby' : 'Tap to open order feed'}
                  </Text>
                </View>
                <View style={styles.boostBadge}>
                  <Text style={styles.boostText}>X1.2 BOOST</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6f7485" />
              </Pressable>
            </View>
          ) : null}

          <Animated.View style={[styles.expandedContent, expandedAnimatedStyle]}>
            {hasActiveOrder && activeOrder ? (
              <>
                <View style={styles.activeDetailsCard}>
                  <View style={styles.pickupTitleRow}>
                    <Text style={styles.pickupTitleText} numberOfLines={2}>
                      {activeOrder.pickupAddress}
                    </Text>
                    <View style={styles.pickupNavIconWrap}>
                      <Ionicons name="navigate" size={15} color="#f08d5a" />
                    </View>
                  </View>
                  <View style={styles.pickupSubRow}>
                    <View style={styles.pickupDot} />
                    <Text style={styles.pickupSubText}>Pickup location · 250m away</Text>
                  </View>

                  <View style={styles.activeMetricsRow}>
                    <View style={styles.activeMetricCard}>
                      <Text style={styles.activeMetricLabel}>EARNINGS</Text>
                      <View style={styles.earningsRow}>
                        <Text style={styles.activeMetricValue}>{activeOrder.earnings} KZT</Text>
                        <View style={styles.earningsBoostPill}>
                          <Text style={styles.earningsBoostText}>+20%</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.activeMetricCard}>
                      <Text style={styles.activeMetricLabel}>PACKAGE</Text>
                      <View style={styles.packageLine}>
                        <Ionicons name="cube" size={14} color="#f08d5a" />
                        <Text style={styles.activeMetricValueSmall}>Standard Parcel</Text>
                      </View>
                      <Text style={styles.activeMetricHint}>under 5kg</Text>
                    </View>
                  </View>

                  <View style={styles.courierRow}>
                    <View style={styles.courierMain}>
                      <View style={styles.courierAvatar}>
                        <Text style={styles.courierAvatarText}>{getInitials(courierName)}</Text>
                      </View>
                      <View style={styles.courierMeta}>
                        <Text style={styles.courierNameText} numberOfLines={1}>{courierName}</Text>
                        <Text style={styles.courierPhoneText}>{courierPhone}</Text>
                      </View>
                    </View>
                    <View style={styles.courierActions}>
                      <Pressable style={styles.courierActionBtn}>
                        <Ionicons name="chatbox" size={14} color="#f1f3f8" />
                      </Pressable>
                      <Pressable style={styles.courierActionBtnPrimary}>
                        <Ionicons name="call" size={14} color="#2d1b13" />
                      </Pressable>
                    </View>
                  </View>

                </View>
              </>
            ) : null}
          </Animated.View>

          <View style={styles.bottomControls}>
            {hasActiveOrder ? (
              <Animated.View style={expandedFooterAnimatedStyle} pointerEvents={isExpanded ? 'auto' : 'none'}>
                <Pressable style={styles.arrivedButton} onPress={() => void advanceStage()}>
                  <Text style={styles.arrivedButtonText}>{activeActionLabel}</Text>
                </Pressable>
                <Pressable style={styles.cancelOrderInlineButton} onPress={() => void cancelActiveOrder()}>
                  <Ionicons name="close-circle-outline" size={16} color="#ef706a" />
                  <Text style={styles.cancelOrderInlineText}>Cancel order</Text>
                </Pressable>
                <Pressable style={styles.viewDetailsLink} onPress={openOrderDetails}>
                  <Text style={styles.viewDetailsLinkText}>View Order Details</Text>
                  <Ionicons name="arrow-forward" size={14} color="#9da2af" />
                </Pressable>
              </Animated.View>
            ) : !hasActiveOrder ? (
              <MainButton title={mainCtaTitle} disabled={activating || hasActiveOrder} onPress={toggleOnline} />
            ) : null}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090b10',
  },
  topBarContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2a2f3f',
    backgroundColor: 'rgba(22, 25, 36, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackground: {
    backgroundColor: 'rgba(54, 51, 57, 0.97)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: '#2a2f3c',
  },
  handleContainer: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#66616a',
    opacity: 0.6,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingTop: 2,
  },
  sheetTop: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#9997a1',
  },
  statusText: {
    color: '#f2f3f7',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  helperText: {
    color: '#c0bec3',
    fontSize: 14,
    marginTop: -2,
  },
  activeCompactCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3640',
    backgroundColor: '#2b2930',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 2,
  },
  activeCompactTitle: {
    color: '#f0f1f7',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  activeCompactHint: {
    color: '#b0aeb8',
    fontSize: 12,
  },
  collapsedActionRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 2,
    gap: 10,
  },
  collapsedSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4a4752',
    backgroundColor: '#27252d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  collapsedSecondaryText: {
    color: '#f3f4f8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  collapsedPrimaryButton: {
    flex: 1.15,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#ee8f5e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#f1a173',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  collapsedPrimaryText: {
    color: '#2b1a13',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  expandedContent: {
    marginTop: 4,
    paddingHorizontal: 16,
    gap: 10,
  },
  idleContent: {
    marginTop: 4,
    paddingHorizontal: 16,
    gap: 10,
  },
  activeDetailsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3d3941',
    backgroundColor: '#343237',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  pickupTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pickupTitleText: {
    flex: 1,
    color: '#f3f4f8',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  pickupNavIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3b3631',
    borderWidth: 1,
    borderColor: '#5a4e42',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pickupSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f08d5a',
  },
  pickupSubText: {
    color: '#b1b4be',
    fontSize: 13,
  },
  activeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activeMetricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262529',
    backgroundColor: '#141418',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 5,
  },
  activeMetricLabel: {
    color: '#74778a',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 8,
    marginTop: 2,
  },
  activeMetricValue: {
    color: '#f08d5a',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    flexShrink: 1,
  },
  earningsBoostPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#6a4934',
    backgroundColor: '#2a241f',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  earningsBoostText: {
    color: '#f08d5a',
    fontSize: 11,
    fontWeight: '700',
  },
  packageLine: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeMetricValueSmall: {
    color: '#f2f3f7',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  activeMetricHint: {
    color: '#8a8e9c',
    fontSize: 12,
  },
  courierRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38363d',
    backgroundColor: '#272530',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  courierMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courierAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3e5a6d',
    borderWidth: 2,
    borderColor: '#5a7a90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierAvatarText: {
    color: '#f4f7fb',
    fontSize: 15,
    fontWeight: '800',
  },
  courierMeta: {
    flex: 1,
  },
  courierNameText: {
    color: '#f0f2f7',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  courierPhoneText: {
    marginTop: 1,
    color: '#8c91a0',
    fontSize: 13,
  },
  courierActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courierActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#4a4852',
    backgroundColor: '#2a2930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierActionBtnPrimary: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f08d5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#2b2a2f',
    borderWidth: 1,
    borderColor: '#34333a',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  metricLabel: {
    color: '#90909b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metricValue: {
    color: '#f0f2f7',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },
  parkRow: {
    marginTop: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#37343c',
    backgroundColor: '#343035',
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parkMain: {
    flex: 1,
    gap: 2,
  },
  parkTitle: {
    color: '#eceef6',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  parkHint: {
    color: '#9e9ca5',
    fontSize: 12,
  },
  boostBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#8c6426',
    backgroundColor: '#594019',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  boostText: {
    color: '#ffc06a',
    fontSize: 9,
    fontWeight: '700',
  },
  incomingOverlayCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2c2f39',
    backgroundColor: 'rgba(24, 24, 27, 0.96)',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  incomingTopHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomingTopTag: {
    color: '#f08d5a',
    fontSize: 12,
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  incomingPricePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#69493a',
    backgroundColor: '#2f2723',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  incomingPriceText: {
    color: '#f39a68',
    fontSize: 20,
    fontWeight: '700',
  },
  incomingTopClient: {
    color: '#f3f5fb',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  incomingTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#b9bcc7',
    fontSize: 17,
    fontWeight: '600',
  },
  incomingTopActions: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3a3940',
    backgroundColor: '#2a2a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#eceef5',
    fontSize: 18,
    fontWeight: '700',
  },
  acceptTopButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#f08d5a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f08d5a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 8,
  },
  acceptTopButtonText: {
    color: '#2d1b13',
    fontSize: 22,
    fontWeight: '800',
  },
  orderBlock: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d3a42',
    backgroundColor: '#28262d',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  orderBlockRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d3a42',
    backgroundColor: '#28262d',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderBlockHeadBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  blockLabel: {
    color: '#9f9ea6',
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  securityCodeText: {
    color: '#f2f2f5',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '800',
  },
  qrMock: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#1f1e24',
    padding: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  qrCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: '#5b5964',
  },
  qrCellDark: {
    backgroundColor: '#2f2d35',
  },
  metaList: {
    gap: 4,
  },
  metaListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaListItemText: {
    color: '#aeadb5',
    fontSize: 11,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blockTitle: {
    color: '#f1f2f7',
    fontSize: 16,
    fontWeight: '600',
  },
  blockBody: {
    color: '#c6c5cc',
    fontSize: 12,
    lineHeight: 18,
  },
  packageBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#71522f',
    backgroundColor: '#46311d',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  packageBadgeText: {
    color: '#f2b25d',
    fontSize: 10,
    fontWeight: '700',
  },
  parcelRow: {
    borderRadius: 10,
    backgroundColor: '#232127',
    borderWidth: 1,
    borderColor: '#3a3740',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
  },
  parcelThumb: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#4f3b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelTitle: {
    color: '#f2f4f8',
    fontSize: 13,
    fontWeight: '700',
  },
  parcelSub: {
    color: '#9f9ca6',
    fontSize: 11,
  },
  paymentValue: {
    color: '#f2f2f5',
    fontSize: 16,
    fontWeight: '700',
  },
  supportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  supportButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#484651',
    backgroundColor: '#2a2830',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  supportButtonText: {
    color: '#e1e2e7',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelOrderButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderButtonText: {
    color: '#ef706a',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 0,
  },
  orderDetailsButton: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4d4a54',
    backgroundColor: '#2c2a31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetailsButtonText: {
    color: '#f0f1f7',
    fontSize: 14,
    fontWeight: '600',
  },
  arrivedButton: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: '#f08d5a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f08d5a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 14,
  },
  arrivedButtonText: {
    color: '#2d1b13',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  viewDetailsLink: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 2,
  },
  viewDetailsLinkText: {
    color: '#9da3b0',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelOrderInlineButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 112, 106, 0.45)',
    backgroundColor: 'rgba(69, 30, 33, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 0,
    marginBottom: 8,
  },
  cancelOrderInlineText: {
    color: '#ef706a',
    fontSize: 14,
    fontWeight: '700',
  },
  mainButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#e9743f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  mainButtonDisabled: {
    opacity: 0.6,
  },
  mainButtonText: {
    color: '#2d1b13',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(240, 141, 90, 0.25)',
  },
  markerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f08d5a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
