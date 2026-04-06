import { isActiveOrderStatus } from '../../domain/orders/model'

export const ORDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'new', label: 'New' },
  { key: 'done', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function filterOrdersByMode(orders, filter) {
  if (filter === 'all') return orders
  if (filter === 'active') return orders.filter(order => isActiveOrderStatus(order.status))
  return orders.filter(order => order.status === filter)
}

export function countActiveOrders(orders) {
  return orders.filter(order => isActiveOrderStatus(order.status)).length
}
