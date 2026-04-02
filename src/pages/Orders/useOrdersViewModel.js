import { useMemo, useState } from 'react'
import { useOrdersState } from '../../state/OrdersContext'
import { isActiveOrderStatus } from '../../domain/orders/model'
import { useWebAppNavigator } from '../../navigation/useWebAppNavigator'

export const ORDER_FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'new', label: 'Новые' },
  { key: 'done', label: 'Выполненные' },
  { key: 'cancelled', label: 'Отменённые' },
]

export function useOrdersViewModel() {
  const appNavigator = useWebAppNavigator()
  const { orders } = useOrdersState()
  const [filter, setFilter] = useState('all')

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'active') return orders.filter(order => isActiveOrderStatus(order.status))
    return orders.filter(order => order.status === filter)
  }, [filter, orders])

  const activeOrdersCount = useMemo(
    () => orders.filter(order => isActiveOrderStatus(order.status)).length,
    [orders],
  )

  const openOrderDetails = orderId => {
    appNavigator.openOrderDetails(orderId)
  }

  return {
    filter,
    setFilter,
    filteredOrders,
    activeOrdersCount,
    openOrderDetails,
  }
}
