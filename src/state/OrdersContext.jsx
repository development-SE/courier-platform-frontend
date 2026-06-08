import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchOrders, updateOrderStatus } from '../api/ordersApi'
import { getStorageItem, setStorageItem } from '../platform/storage'
import {
  ORDER_STAGES,
  getBootstrapOrdersState,
  sanitizePersistedOrdersState,
} from '@core/use-cases/orders/persistedState'

const ORDERS_STATE_STORAGE_KEY = 'courier_orders_state_v1'

// Map backend order statuses to mobile display statuses
const STATUS_MAP = {
  NEW: 'new',
  ACCEPTED: 'new',
  PREPARING: 'new',
  READY: 'new',
  ASSIGNMENT_PENDING: 'new',
  ASSIGNED: 'new',
  PICKED_UP: 'pickup',
  IN_TRANSIT: 'delivery',
  DELIVERY_CONFIRMATION_PENDING: 'delivery',
  DELIVERED: 'done',
  CANCELLED: 'cancelled',
  REJECTED: 'cancelled',
}

// Map mobile stage transitions to backend status strings
const STAGE_TO_BACKEND_STATUS = {
  accept:  'PICKED_UP',
  pickup:  'IN_TRANSIT',
  deliver: 'DELIVERED',
  cancel:  'CANCELLED',
}

const PAYMENT_LABEL = {
  cashless: 'Безналичная оплата',
  cash: 'Наличные',
  CASHLESS: 'Безналичная оплата',
  CASH: 'Наличные',
}

const OrdersContext = createContext(null)

function normalizeApiOrder(order) {
  return {
    id: order.id ?? order.orderId ?? String(Math.random()),
    status: STATUS_MAP[order.status] ?? 'new',
    client: order.companyName || order.clientName || order.client || 'Клиент',
    deliveryType: order.deliveryType || 'door_to_door',
    clientPhone: order.clientPhone || '',
    pickupAddress: order.pickupAddress?.street
      || order.pickupAddressText
      || order.originAddress
      || 'Адрес получения',
    deliveryAddress: order.deliveryAddress?.street
      || order.deliveryAddressText
      || order.destinationAddress
      || 'Адрес доставки',
    pickupCode: order.pickupCode || null,
    pickupDeadline: order.pickupDeadline || order.expectedPickupTime || '',
    deliveryDeadline: order.deliveryDeadline || order.expectedDeliveryTime || '',
    pointsCount: 2,
    payment: order.paymentMethod || order.payment || 'cashless',
    parcelsCount: order.parcelsCount || order.itemsCount || 1,
    earnings: order.courierFee || order.fee || order.totalAmount || 0,
    distance: order.distanceKm ? `${order.distanceKm} км` : '',
    estimatedMin: order.estimatedDurationMinutes || order.estimatedMin || 0,
    priority: order.priority || 0,
    comment: order.notes || order.comment || '',
    createdAt: order.createdAt || new Date().toISOString(),
  }
}

function normalizeActiveOrder(order) {
  if (!order) return null
  return {
    id: order.id,
    number: order.id,
    client: order.client,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    pickupCode: order.pickupCode ?? '—',
    comment: order.comment || 'Комментарий отсутствует.',
    parcelsCount: order.parcelsCount ?? 1,
    paymentType: PAYMENT_LABEL[order.payment] ?? 'Безналичная оплата',
    pickupEta: order.pickupDeadline ?? '',
    deliveryEta: order.deliveryDeadline ?? '',
  }
}

function readPersistedState() {
  try {
    const raw = getStorageItem(ORDERS_STATE_STORAGE_KEY)
    if (!raw) return null
    return sanitizePersistedOrdersState(JSON.parse(raw))
  } catch {
    return null
  }
}

const FALLBACK_STATE = readPersistedState() ?? getBootstrapOrdersState([])

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(FALLBACK_STATE.orders)
  const [activeOrderId, setActiveOrderId] = useState(FALLBACK_STATE.activeOrderId)
  const [orderStage, setOrderStage] = useState(FALLBACK_STATE.orderStage)
  const [loadError, setLoadError] = useState(null)

  // Load orders from backend on mount
  useEffect(() => {
    let cancelled = false
    fetchOrders({ size: 30 })
      .then(apiOrders => {
        if (cancelled) return
        const normalized = apiOrders.map(normalizeApiOrder)
        if (normalized.length > 0) {
          setOrders(normalized)
          setLoadError(null)
        }
      })
      .catch(err => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => { cancelled = true }
  }, [])

  const activeOrder = useMemo(() => {
    const order = orders.find(item => item.id === activeOrderId)
    return normalizeActiveOrder(order)
  }, [activeOrderId, orders])

  const hasActiveOrder = Boolean(activeOrder)

  useEffect(() => {
    try {
      setStorageItem(ORDERS_STATE_STORAGE_KEY, JSON.stringify({ orders, activeOrderId, orderStage }))
    } catch {
      // storage unavailable
    }
  }, [orders, activeOrderId, orderStage])

  const updateOrderStatusLocal = useCallback((orderId, status) => {
    setOrders(prev => prev.map(order => (
      order.id === orderId ? { ...order, status } : order
    )))
  }, [])

  const updateOrderStatusRemote = useCallback(async (orderId, action) => {
    const backendStatus = STAGE_TO_BACKEND_STATUS[action]
    if (!backendStatus) return
    try {
      await updateOrderStatus(orderId, backendStatus)
    } catch {
      // fail silently — local state already updated
    }
  }, [])

  const acceptIncomingOrder = useCallback((orderId) => {
    const targetId = orderId ?? orders.find(o => o.status === 'new')?.id
    if (!targetId) return
    updateOrderStatusLocal(targetId, 'pickup')
    setActiveOrderId(targetId)
    setOrderStage(ORDER_STAGES.TO_PICKUP)
    updateOrderStatusRemote(targetId, 'accept')
  }, [orders, updateOrderStatusLocal, updateOrderStatusRemote])

  const advanceOrderStage = useCallback(() => {
    if (!activeOrderId) return ORDER_STAGES.WAITING

    if (orderStage === ORDER_STAGES.TO_PICKUP) {
      setOrderStage(ORDER_STAGES.ARRIVED_PICKUP)
      return ORDER_STAGES.ARRIVED_PICKUP
    }

    if (orderStage === ORDER_STAGES.ARRIVED_PICKUP) {
      updateOrderStatusLocal(activeOrderId, 'delivery')
      updateOrderStatusRemote(activeOrderId, 'pickup')
      setOrderStage(ORDER_STAGES.TO_CUSTOMER)
      return ORDER_STAGES.TO_CUSTOMER
    }

    if (orderStage === ORDER_STAGES.TO_CUSTOMER) {
      updateOrderStatusLocal(activeOrderId, 'done')
      updateOrderStatusRemote(activeOrderId, 'deliver')
      setActiveOrderId(null)
      setOrderStage(ORDER_STAGES.WAITING)
      return 'delivered'
    }

    updateOrderStatusLocal(activeOrderId, 'done')
    return 'delivered'
  }, [activeOrderId, orderStage, updateOrderStatusLocal, updateOrderStatusRemote])

  const cancelOrder = useCallback(() => {
    if (!activeOrderId) return
    updateOrderStatusLocal(activeOrderId, 'cancelled')
    updateOrderStatusRemote(activeOrderId, 'cancel')
    setActiveOrderId(null)
    setOrderStage(ORDER_STAGES.WAITING)
  }, [activeOrderId, updateOrderStatusLocal, updateOrderStatusRemote])

  const value = useMemo(() => ({
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    loadError,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
    updateOrderStatus: updateOrderStatusLocal,
  }), [
    orders, activeOrder, orderStage, hasActiveOrder, loadError,
    acceptIncomingOrder, advanceOrderStage, cancelOrder, updateOrderStatusLocal,
  ])

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrdersState() {
  const value = useContext(OrdersContext)
  if (!value) throw new Error('useOrdersState must be used within OrdersProvider')
  return value
}

export { ORDER_STAGES }
