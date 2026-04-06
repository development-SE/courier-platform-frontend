import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useNativeDashboardViewModel } from './useNativeDashboardViewModel'
import { NativeCourierMap } from '../components/NativeCourierMap'
import { NativeBottomSheet } from '../components/NativeBottomSheet'

const STATUS_LABEL = {
  offline: 'Не на линии',
  online: 'На линии',
  busy: 'В заказе',
}

function QuickAction({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  )
}

function IncomingOrderSheet({ order, onAccept, onSkip }) {
  return (
    <View style={styles.incomingOverlay}>
      <View style={styles.incomingCard}>
        <Text style={styles.incomingTitle}>Новый заказ</Text>
        <Text style={styles.incomingEarnings}>+{order.earnings} ₸</Text>
        <Text style={styles.incomingMeta}>~{order.estimatedMin} мин · {order.distance}</Text>
        <Text style={styles.incomingAddress}>{order.pickupAddress}</Text>
        <Text style={styles.incomingPriority}>Принять: приоритет +{order.priorityGain}</Text>
        <Text style={styles.incomingPrioritySecondary}>Пропустить: приоритет -{order.priorityLoss}</Text>

        <View style={styles.incomingActions}>
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Пропустить</Text>
          </Pressable>
          <Pressable onPress={onAccept} style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Принять</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export function NativeDashboardScreen() {
  const {
    courier,
    incomingOrder,
    courierPosition,
    status,
    showIncoming,
    activating,
    orders,
    activeOrder,
    hasActiveOrder,
    stageMeta,
    onToggleOnline,
    onAcceptIncoming,
    onSkipIncoming,
    onOrderAction,
    onCancelOrder,
    onOpenSlots,
    onOpenSupport,
    onOpenDiagnostics,
    onOpenOrderDetails,
  } = useNativeDashboardViewModel()

  const [longitude, latitude] = courierPosition

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>+{courier.score}</Text>
          </View>
          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>Статус</Text>
            <Text style={styles.statusValue}>{STATUS_LABEL[status] ?? status}</Text>
          </View>
          <Pressable
            onPress={onToggleOnline}
            disabled={activating}
            style={[styles.onlineButton, activating ? styles.onlineButtonDisabled : null]}
          >
            <Text style={styles.onlineButtonText}>
              {activating ? 'Подключаемся...' : status === 'offline' ? 'На линию' : 'Завершить смену'}
            </Text>
          </Pressable>
        </View>

        <NativeCourierMap
          longitude={longitude}
          latitude={latitude}
          markerTitle={`${courier.name} ${courier.lastName}`}
        />

        <NativeBottomSheet>
          {hasActiveOrder && activeOrder && stageMeta ? (
            <>
              <Text style={styles.orderChip}>{stageMeta.chip}</Text>
              <Text style={styles.orderTitle}>{activeOrder.client}</Text>
              <Text style={styles.orderNumber}>Заказ {activeOrder.id}</Text>
              <Text style={styles.orderHint}>{stageMeta.helper}</Text>
              <Text style={styles.orderEta}>Срок: {stageMeta.eta}</Text>

              <Pressable onPress={onOrderAction} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionText}>{stageMeta.primaryAction}</Text>
              </Pressable>

              <Pressable onPress={onOpenOrderDetails} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Открыть детали заказа</Text>
              </Pressable>
              <Pressable onPress={onCancelOrder} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Отменить заказ</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sheetTitle}>Смена</Text>
              <Text style={styles.sheetText}>
                {status === 'offline'
                  ? 'Выйдите на линию, чтобы получать входящие заказы.'
                  : 'Ожидаем новый заказ. Подготовьте навигацию и связь.'}
              </Text>
              <Text style={styles.ordersCount}>Всего заказов: {orders.length}</Text>
              <View style={styles.quickActionsRow}>
                <QuickAction label="Слоты" onPress={onOpenSlots} />
                <QuickAction label="Поддержка" onPress={onOpenSupport} />
                <QuickAction label="Диагностика" onPress={onOpenDiagnostics} />
              </View>
            </>
          )}
        </NativeBottomSheet>
      </View>

      {showIncoming && !hasActiveOrder ? (
        <IncomingOrderSheet
          order={incomingOrder}
          onAccept={onAcceptIncoming}
          onSkip={onSkipIncoming}
        />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  statusRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#141621',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreBadge: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cd5e3d',
  },
  scoreText: {
    color: '#fff8f5',
    fontWeight: '800',
    fontSize: 14,
  },
  statusBlock: {
    flex: 1,
    gap: 1,
  },
  statusLabel: {
    color: '#8f95ac',
    fontSize: 11,
  },
  statusValue: {
    color: '#f4f5fb',
    fontSize: 14,
    fontWeight: '700',
  },
  onlineButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#cd5e3d',
  },
  onlineButtonDisabled: {
    opacity: 0.65,
  },
  onlineButtonText: {
    color: '#fff7f3',
    fontSize: 12,
    fontWeight: '700',
  },
  orderChip: {
    color: '#17171f',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#f9c770',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderTitle: {
    color: '#f5f6fb',
    fontSize: 16,
    fontWeight: '700',
  },
  orderNumber: {
    color: '#8f95ac',
    fontSize: 12,
  },
  orderHint: {
    color: '#b8bdd0',
    fontSize: 13,
    lineHeight: 18,
  },
  orderEta: {
    color: '#f7c978',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryActionButton: {
    borderRadius: 12,
    backgroundColor: '#cd5e3d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  primaryActionText: {
    color: '#fff7f3',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f3250',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1a1c2b',
  },
  secondaryButtonText: {
    color: '#e7e9f7',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7e3646',
    backgroundColor: '#3a1f2a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#ffd9df',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetTitle: {
    color: '#f4f5fb',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetText: {
    color: '#b8bdd0',
    fontSize: 13,
    lineHeight: 18,
  },
  ordersCount: {
    color: '#8f95ac',
    fontSize: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f3250',
    backgroundColor: '#1a1c2b',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
  },
  quickActionText: {
    color: '#e7e9f7',
    fontSize: 12,
    fontWeight: '600',
  },
  incomingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 8, 12, 0.72)',
    justifyContent: 'flex-end',
  },
  incomingCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2d45',
    backgroundColor: '#111320',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  incomingTitle: {
    color: '#f4f5fb',
    fontSize: 16,
    fontWeight: '700',
  },
  incomingEarnings: {
    color: '#8ce6a9',
    fontSize: 20,
    fontWeight: '800',
  },
  incomingMeta: {
    color: '#b8bdd0',
    fontSize: 13,
  },
  incomingAddress: {
    color: '#eef0f8',
    fontSize: 13,
  },
  incomingPriority: {
    color: '#95e0b0',
    fontSize: 12,
  },
  incomingPrioritySecondary: {
    color: '#f0a7b3',
    fontSize: 12,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f3250',
    backgroundColor: '#1a1c2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#f3f5ff',
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#cd5e3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff7f3',
    fontWeight: '700',
  },
})
