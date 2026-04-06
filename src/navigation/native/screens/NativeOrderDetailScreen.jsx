import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ORDER_STATUS, ORDER_DELIVERY_TYPE } from '@core/domain/orders/model'
import { useOrdersState } from '../../../state/OrdersContext'

const STATUS_SEQUENCE = {
  [ORDER_STATUS.PICKUP]: ORDER_STATUS.DELIVERY,
  [ORDER_STATUS.DELIVERY]: ORDER_STATUS.DONE,
}

const ACTION_LABEL = {
  [ORDER_STATUS.PICKUP]: 'Я на месте',
  [ORDER_STATUS.DELIVERY]: 'Доставлено',
  [ORDER_STATUS.DONE]: 'Заказ выполнен',
  [ORDER_STATUS.CANCELLED]: 'Заказ отменен',
  [ORDER_STATUS.NEW]: 'Принять заказ',
}

const DELIVERY_TYPE_LABEL = {
  [ORDER_DELIVERY_TYPE.DOOR_TO_DOOR]: 'От двери до двери',
  [ORDER_DELIVERY_TYPE.PICKUP_POINT]: 'Пункт выдачи',
}

const PAYMENT_LABEL = {
  cashless: 'Безналичная оплата',
  cash: 'Наличные',
}

function Badge({ status }) {
  const isDone = status === ORDER_STATUS.DONE
  const label = isDone ? 'Выполнен' : 'Отменен'

  return (
    <Text style={[styles.badge, isDone ? styles.badgeSuccess : styles.badgeError]}>
      {label}
    </Text>
  )
}

export function NativeOrderDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const orderId = String(route.params?.orderId ?? '')
  const { orders, updateOrderStatus } = useOrdersState()
  const order = useMemo(
    () => orders.find(item => item.id === orderId),
    [orders, orderId],
  )

  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setConfirmed(false)
  }, [order?.status])

  if (!order) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.missingWrap}>
          <Text style={styles.missingTitle}>Заказ не найден</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Назад</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const status = order.status
  const isActive = status === ORDER_STATUS.PICKUP || status === ORDER_STATUS.DELIVERY
  const actionLabel = ACTION_LABEL[status] ?? 'Продолжить'
  const deliveryTypeLabel = DELIVERY_TYPE_LABEL[order.deliveryType] ?? DELIVERY_TYPE_LABEL[ORDER_DELIVERY_TYPE.DOOR_TO_DOOR]
  const currentAddress = status === ORDER_STATUS.DELIVERY ? order.deliveryAddress : order.pickupAddress
  const deadline = status === ORDER_STATUS.DELIVERY ? order.deliveryDeadline : order.pickupDeadline

  const handlePrimaryAction = () => {
    if (!isActive) return

    if (!confirmed) {
      setConfirmed(true)
      return
    }

    const next = STATUS_SEQUENCE[status]
    if (!next) return
    updateOrderStatus(order.id, next)
  }

  const handleCancelOrder = () => {
    updateOrderStatus(order.id, ORDER_STATUS.CANCELLED)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>Заказ</Text>
        <Text style={styles.orderNumber}>{order.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>Статус</Text>
          {isActive ? (
            <View style={styles.rowBetween}>
              <Text style={styles.value}>{status === ORDER_STATUS.PICKUP ? 'К отправителю' : 'К получателю'}</Text>
              <Text style={styles.deadline}>{deadline}</Text>
            </View>
          ) : (
            <Badge status={status} />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Клиент</Text>
          <Text style={styles.value}>{order.client}</Text>
          <Text style={styles.meta}>{deliveryTypeLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{status === ORDER_STATUS.DELIVERY ? 'Адрес доставки' : 'Адрес получения'}</Text>
          <Text style={styles.value}>{currentAddress}</Text>
        </View>

        {order.pickupCode && status === ORDER_STATUS.PICKUP ? (
          <View style={styles.card}>
            <Text style={styles.label}>Код получения</Text>
            <Text style={styles.pickupCode}>{order.pickupCode}</Text>
          </View>
        ) : null}

        {order.comment ? (
          <View style={styles.card}>
            <Text style={styles.label}>Комментарий</Text>
            <Text style={styles.meta}>{order.comment}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Посылок</Text>
            <Text style={styles.value}>{order.parcelsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Оплата</Text>
            <Text style={styles.value}>{PAYMENT_LABEL[order.payment] ?? 'Безналичная оплата'}</Text>
          </View>
        </View>

        {isActive ? (
          <>
            <Pressable onPress={handlePrimaryAction} style={[styles.primaryButton, confirmed ? styles.primaryButtonConfirm : null]}>
              <Text style={styles.primaryButtonText}>
                {confirmed ? `Подтвердить - ${actionLabel}` : actionLabel}
              </Text>
            </Pressable>

            <Pressable onPress={handleCancelOrder} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Отменить заказ</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2030',
  },
  title: {
    color: '#f2f3f7',
    fontSize: 18,
    fontWeight: '700',
  },
  orderNumber: {
    color: '#8f95ac',
    fontSize: 11,
    maxWidth: 120,
    textAlign: 'right',
  },
  backButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1b1d2c',
  },
  backButtonText: {
    color: '#edf0fb',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    gap: 10,
    padding: 14,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#141621',
    padding: 12,
    gap: 6,
  },
  label: {
    color: '#8f95ac',
    fontSize: 12,
  },
  value: {
    color: '#f4f5fb',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#b8bdd0',
    fontSize: 13,
    lineHeight: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadline: {
    color: '#f7c978',
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    color: '#daf7e5',
    backgroundColor: '#2b7b57',
  },
  badgeError: {
    color: '#ffe1e6',
    backgroundColor: '#9b3f52',
  },
  pickupCode: {
    color: '#f8d89f',
    fontSize: 22,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: '#cd5e3d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 4,
  },
  primaryButtonConfirm: {
    backgroundColor: '#b44f31',
  },
  primaryButtonText: {
    color: '#fff7f3',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7e3646',
    backgroundColor: '#3a1f2a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#ffd9df',
    fontSize: 14,
    fontWeight: '700',
  },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  missingTitle: {
    color: '#f2f3f7',
    fontSize: 20,
    fontWeight: '700',
  },
})
