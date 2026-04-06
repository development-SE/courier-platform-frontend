import { isActiveOrderStatus, normalizeOrders, ORDER_STATUS } from '../../domain/orders/model'

export const ORDER_STAGES = {
  WAITING: 'waiting',
  TO_PICKUP: 'to_pickup',
  ARRIVED_PICKUP: 'arrived_pickup',
  TO_CUSTOMER: 'to_customer',
}

const ORDER_STAGE_VALUES = new Set(Object.values(ORDER_STAGES))

export function getInitialActiveOrderId(orders) {
  const activeOrder = orders.find(order => isActiveOrderStatus(order.status))
  return activeOrder?.id ?? null
}

export function getInitialStage(orders, activeOrderId) {
  if (!activeOrderId) return ORDER_STAGES.WAITING
  const activeOrder = orders.find(order => order.id === activeOrderId)
  if (!activeOrder) return ORDER_STAGES.WAITING
  return activeOrder.status === ORDER_STATUS.DELIVERY ? ORDER_STAGES.TO_CUSTOMER : ORDER_STAGES.TO_PICKUP
}

export function getBootstrapOrdersState(rawOrders) {
  const orders = normalizeOrders(rawOrders)
  const activeOrderId = getInitialActiveOrderId(orders)
  const orderStage = getInitialStage(orders, activeOrderId)
  return { orders, activeOrderId, orderStage }
}

export function resolveOrderStage(activeOrder, persistedStage) {
  if (!activeOrder) return ORDER_STAGES.WAITING

  if (activeOrder.status === ORDER_STATUS.DELIVERY) {
    return ORDER_STAGES.TO_CUSTOMER
  }

  if (activeOrder.status === ORDER_STATUS.PICKUP) {
    if (persistedStage === ORDER_STAGES.ARRIVED_PICKUP || persistedStage === ORDER_STAGES.TO_PICKUP) {
      return persistedStage
    }
    return ORDER_STAGES.TO_PICKUP
  }

  return ORDER_STAGES.WAITING
}

export function sanitizePersistedOrdersState(rawState) {
  if (!rawState || typeof rawState !== 'object' || !Array.isArray(rawState.orders)) {
    return null
  }

  const orders = normalizeOrders(rawState.orders)
  const rawActiveOrderId = typeof rawState.activeOrderId === 'string' ? rawState.activeOrderId : null
  const activeOrderId = rawActiveOrderId && orders.some(order => order.id === rawActiveOrderId)
    ? rawActiveOrderId
    : getInitialActiveOrderId(orders)

  const activeOrder = orders.find(order => order.id === activeOrderId)
  const persistedStage = ORDER_STAGE_VALUES.has(rawState.orderStage) ? rawState.orderStage : ORDER_STAGES.WAITING
  const orderStage = resolveOrderStage(activeOrder, persistedStage)

  return { orders, activeOrderId, orderStage }
}
