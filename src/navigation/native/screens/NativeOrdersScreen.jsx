import { FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ORDER_FILTERS, useNativeOrdersViewModel } from './useNativeOrdersViewModel'

const STATUS_LABEL = {
  new: 'Новый',
  pickup: 'К отправителю',
  delivery: 'К получателю',
  done: 'Выполнен',
  cancelled: 'Отменен',
}

function FilterButton({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterBtn, active ? styles.filterBtnActive : null]}
    >
      <Text style={[styles.filterBtnText, active ? styles.filterBtnTextActive : null]}>{label}</Text>
    </Pressable>
  )
}

function OrderCard({ order, onOpen }) {
  return (
    <Pressable onPress={() => onOpen(order.id)} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.status}>{STATUS_LABEL[order.status] ?? order.status}</Text>
        <Text style={styles.earnings}>
          {order.earnings > 0 ? `+${order.earnings.toLocaleString('ru-RU')} ₸` : '-'}
        </Text>
      </View>

      <Text style={styles.client}>{order.client}</Text>
      <Text style={styles.route} numberOfLines={1}>{order.pickupAddress}</Text>
      <Text style={styles.route} numberOfLines={1}>{order.deliveryAddress}</Text>
    </Pressable>
  )
}

export function NativeOrdersScreen() {
  const {
    filter,
    setFilter,
    filteredOrders,
    activeOrdersCount,
    openOrderDetails,
  } = useNativeOrdersViewModel()

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Заказы</Text>
        {activeOrdersCount > 0 && <Text style={styles.badge}>{activeOrdersCount} активных</Text>}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {ORDER_FILTERS.map(item => (
          <FilterButton
            key={item.key}
            label={item.label}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <OrderCard order={item} onOpen={openOrderDetails} />}
        ListEmptyComponent={<Text style={styles.empty}>Нет заказов</Text>}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f2f3f7',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#17171f',
    backgroundColor: '#f9c770',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterBtn: {
    borderWidth: 1,
    borderColor: '#2b2c37',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#10111a',
  },
  filterBtnActive: {
    borderColor: '#cd5e3d',
    backgroundColor: '#cd5e3d',
  },
  filterBtnText: {
    color: '#b4b7c8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff6f1',
  },
  list: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  card: {
    backgroundColor: '#151620',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#24263a',
    padding: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    color: '#f2f3f7',
    fontSize: 12,
    fontWeight: '600',
  },
  earnings: {
    color: '#8ce6a9',
    fontSize: 12,
    fontWeight: '700',
  },
  client: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  route: {
    color: '#b4b7c8',
    fontSize: 13,
  },
  empty: {
    color: '#8a8ea5',
    textAlign: 'center',
    marginTop: 40,
  },
})
