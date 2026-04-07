import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Platform,
} from 'react-native'
import { ordersApi } from '../../api/orders.api'

const STATUS_LABELS = {
  PENDING: { label: 'Ожидает', color: '#f59e0b', bg: '#fef3c7' },
  ASSIGNED: { label: 'Назначен', color: '#3b82f6', bg: '#dbeafe' },
  PICKED_UP: { label: 'Забрали', color: '#8b5cf6', bg: '#ede9fe' },
  IN_TRANSIT: { label: 'В пути', color: '#FC3F1D', bg: '#fee2e2' },
  DELIVERED: { label: 'Доставлен', color: '#10b981', bg: '#d1fae5' },
  CANCELLED: { label: 'Отменён', color: '#6b7280', bg: '#f3f4f6' },
}

const OrderCard = ({ order, onPress }) => {
  const status = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <Text style={styles.orderId}>Заказ #{order.orderId?.slice(-6)}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.routeDot} />
        <Text style={styles.routeText} numberOfLines={1}>
          {order.pickupAddress?.street || 'Адрес отправления'}
        </Text>
      </View>
      <View style={styles.routeLine} />
      <View style={styles.route}>
        <View style={[styles.routeDot, { backgroundColor: '#FC3F1D' }]} />
        <Text style={styles.routeText} numberOfLines={1}>
          {order.deliveryAddress?.street || 'Адрес доставки'}
        </Text>
      </View>
      <Text style={styles.cardDate}>
        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : ''}
      </Text>
    </TouchableOpacity>
  )
}

export const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadOrders = useCallback(async () => {
  try {
    setError(null)
    const res = await ordersApi.list()
    // Backend returns { success: true, data: { orders: [...], totalCount: N } }
    const orders = res.data?.orders || res.orders || []
    setOrders(orders)
  } catch (err) {
    setError('Не удалось загрузить заказы')
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const handlePress = (order) => {
  navigation.navigate('OrderTracking', { orderId: order.orderId })
}

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FC3F1D" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Мои заказы</Text>
        <View style={styles.headerSpacer} />
        
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId || item.id || Math.random().toString()}
        renderItem={({ item }) => <OrderCard order={item} onPress={handlePress} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadOrders() }}
            tintColor="#FC3F1D"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Заказов пока нет</Text>
            <Text style={styles.emptySub}>Нажмите «+ Новый» чтобы создать заказ</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#FC3F1D',
    fontWeight: '700',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0d0d0d' },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  newBtn: {
    backgroundColor: '#FC3F1D',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#0d0d0d' },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#10b981',
  },
  routeText: { fontSize: 13, color: '#444', flex: 1 },
  routeLine: {
    width: 1, height: 12, backgroundColor: '#e0e0e0',
    marginLeft: 3.5, marginVertical: 3,
  },
  cardDate: { fontSize: 12, color: '#aaa', marginTop: 10 },
  error: { color: '#d32f2f', textAlign: 'center', margin: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#0d0d0d', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },
})
