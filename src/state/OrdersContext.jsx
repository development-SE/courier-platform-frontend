import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getOrdersSeed } from '../services/courierDataService'
import { ORDER_STATUS } from '../domain/orders/model'
import { getStorageItem, setStorageItem } from '../platform/storage'
import {
  ORDER_STAGES,
  getBootstrapOrdersState,
  sanitizePersistedOrdersState,
} from '@core/use-cases/orders/persistedState'
const ORDERS_STATE_STORAGE_KEY = 'courier_orders_state_v1'

const PAYMENT_LABEL = {
  cashless: 'Безналичная оплата',
  cash: 'Наличные',
}

const PRIMARY_ORDER_ID = '250818-2007978'

const OrdersContext = createContext(null)

function readPersistedState() {
  try {
    const raw = getStorageItem(ORDERS_STATE_STORAGE_KEY)
    if (!raw) return null
    return sanitizePersistedOrdersState(JSON.parse(raw))
  } catch {
    return null
  }
}

function persistState(state) {
  try {
    setStorageItem(ORDERS_STATE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // no-op: storage can be unavailable in private mode or restricted environments
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
    pickupCode: order.pickupCode ?? '385987',
    comment: order.comment || 'Комментарий отсутствует.',
    parcelsCount: order.parcelsCount ?? 1,
    paymentType: PAYMENT_LABEL[order.payment] ?? 'Безналичная оплата',
    pickupEta: order.pickupDeadline ?? '11:40',
    deliveryEta: order.deliveryDeadline ?? '12:20',
  }
}

const INITIAL_STATE = readPersistedState() ?? getBootstrapOrdersState(getOrdersSeed())

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(INITIAL_STATE.orders)
  const [activeOrderId, setActiveOrderId] = useState(INITIAL_STATE.activeOrderId)
  const [orderStage, setOrderStage] = useState(INITIAL_STATE.orderStage)

  const activeOrder = useMemo(() => {
    const order = orders.find(item => item.id === activeOrderId)
    return normalizeActiveOrder(order)
  }, [activeOrderId, orders])

  const hasActiveOrder = Boolean(activeOrder)

  useEffect(() => {
    persistState({ orders, activeOrderId, orderStage })
  }, [orders, activeOrderId, orderStage])

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders(prev => prev.map(order => (
      order.id === orderId ? { ...order, status } : order
    )))

    if (status === ORDER_STATUS.PICKUP) {
      setActiveOrderId(orderId)
      setOrderStage(ORDER_STAGES.TO_PICKUP)
      return
    }

    if (status === ORDER_STATUS.DELIVERY) {
      setActiveOrderId(orderId)
      setOrderStage(ORDER_STAGES.TO_CUSTOMER)
      return
    }

    setActiveOrderId(prevActiveOrderId => {
      if (prevActiveOrderId !== orderId) {
        return prevActiveOrderId
      }
      setOrderStage(ORDER_STAGES.WAITING)
      return null
    })
  }, [])

  const acceptIncomingOrder = useCallback(() => {
    updateOrderStatus(PRIMARY_ORDER_ID, ORDER_STATUS.PICKUP)
  }, [updateOrderStatus])

  const advanceOrderStage = useCallback(() => {
    if (!activeOrderId) return ORDER_STAGES.WAITING

    if (orderStage === ORDER_STAGES.TO_PICKUP) {
      setOrderStage(ORDER_STAGES.ARRIVED_PICKUP)
      return ORDER_STAGES.ARRIVED_PICKUP
    }

    if (orderStage === ORDER_STAGES.ARRIVED_PICKUP) {
      updateOrderStatus(activeOrderId, ORDER_STATUS.DELIVERY)
      return ORDER_STAGES.TO_CUSTOMER
    }

    if (orderStage === ORDER_STAGES.TO_CUSTOMER) {
      updateOrderStatus(activeOrderId, ORDER_STATUS.DONE)
      return 'delivered'
    }

    updateOrderStatus(activeOrderId, ORDER_STATUS.DONE)
    return 'delivered'
  }, [activeOrderId, orderStage, updateOrderStatus])

  const cancelOrder = useCallback(() => {
    if (!activeOrderId) return
    updateOrderStatus(activeOrderId, ORDER_STATUS.CANCELLED)
  }, [activeOrderId, updateOrderStatus])

  const value = useMemo(() => ({
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
    updateOrderStatus,
  }), [
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
    updateOrderStatus,
  ])

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrdersState() {
  const value = useContext(OrdersContext)
  if (!value) {
    throw new Error('useOrdersState must be used within OrdersProvider')
  }
  return value
}

export { ORDER_STAGES }
