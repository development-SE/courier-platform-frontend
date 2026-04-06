import { useMemo, useState } from 'react'
import { useOrdersState } from '../../state/OrdersContext'
import { ORDER_FILTERS, countActiveOrders, filterOrdersByMode } from '@core/use-cases/orders/listOrders'

export { ORDER_FILTERS }

export function useOrdersListModel() {
  const { orders } = useOrdersState()
  const [filter, setFilter] = useState('all')

  const filteredOrders = useMemo(
    () => filterOrdersByMode(orders, filter),
    [filter, orders],
  )

  const activeOrdersCount = useMemo(
    () => countActiveOrders(orders),
    [orders],
  )

  return {
    filter,
    setFilter,
    filteredOrders,
    activeOrdersCount,
  }
}
