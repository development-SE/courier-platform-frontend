export const ORDER_STATUS = {
  NEW: 'new',
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
  DONE: 'done',
  CANCELLED: 'cancelled',
}

export const ORDER_DELIVERY_TYPE = {
  DOOR_TO_DOOR: 'door_to_door',
  PICKUP_POINT: 'pickup_point',
}

const ACTIVE_STATUSES = new Set([ORDER_STATUS.PICKUP, ORDER_STATUS.DELIVERY])

export function isActiveOrderStatus(status) {
  return ACTIVE_STATUSES.has(status)
}

export function normalizeOrder(rawOrder) {
  return {
    ...rawOrder,
    deliveryType: rawOrder.deliveryType ?? ORDER_DELIVERY_TYPE.DOOR_TO_DOOR,
    pointsCount: rawOrder.pointsCount ?? 0,
    parcelsCount: rawOrder.parcelsCount ?? 0,
    comment: rawOrder.comment ?? '',
  }
}

export function normalizeOrders(rawOrders) {
  return rawOrders.map(order => normalizeOrder(order))
}
