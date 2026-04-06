import { useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import type { CourierOrder } from '@swiftdeliver/core'
import { SCREEN_IDS } from '../../constants/screenIds'
import { fetchOrdersFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { Screen } from '../../ui/Screen'
import { AppCard, AppText } from '../../ui/primitives'

const STATUS_LABEL: Record<CourierOrder['status'], string> = {
  new: 'New',
  pickup: 'To pickup',
  delivery: 'To customer',
  done: 'Done',
  cancelled: 'Cancelled',
}

function OrderCard({ item, onOpen }: { item: CourierOrder; onOpen: (id: string) => void }) {
  return (
    <Pressable onPress={() => onOpen(item.id)}>
      <AppCard>
        <View style={styles.cardTop}>
          <AppText variant="label">{STATUS_LABEL[item.status] ?? item.status}</AppText>
          <AppText variant="label" color="#8ce6a9">
            +{item.earnings.toLocaleString('ru-RU')} ₸
          </AppText>
        </View>
        <AppText style={styles.client}>{item.client}</AppText>
        <AppText variant="subtitle">{item.pickupAddress}</AppText>
        <AppText variant="subtitle">{item.deliveryAddress}</AppText>
      </AppCard>
    </Pressable>
  )
}

export function OrdersScreen() {
  const navigation = useNavigation<any>()
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersFromCore,
  })

  const activeCount = useMemo(
    () => data.filter(item => item.status === 'pickup' || item.status === 'delivery').length,
    [data],
  )

  const openDetails = (orderId: string) => {
    navigation.navigate(SCREEN_IDS.ORDER_DETAIL, { orderId })
  }

  return (
    <Screen title="Orders" subtitle={isLoading ? 'Loading orders...' : `${activeCount} active`}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <OrderCard item={item} onOpen={openDetails} />}
        ItemSeparatorComponent={() => <View style={{ height: appTheme.spacing.sm }} />}
        ListEmptyComponent={
          <AppText variant="subtitle" style={styles.empty}>
            {isLoading ? 'Loading...' : 'No orders yet'}
          </AppText>
        }
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  client: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 28,
  },
})
