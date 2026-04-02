import { useMemo } from 'react'
import { ORDER_STAGES, useOrdersState } from '../../state/OrdersContext'

const ORDER_STAGE_META = {
  [ORDER_STAGES.TO_PICKUP]: {
    chip: 'К отправителю',
    helper: 'Приезжайте к отправителю и подтвердите прибытие.',
    primaryAction: 'Я на месте',
  },
  [ORDER_STAGES.ARRIVED_PICKUP]: {
    chip: 'На месте',
    helper: 'Проверьте код получения и заберите посылки.',
    primaryAction: 'Забрал заказ',
  },
  [ORDER_STAGES.TO_CUSTOMER]: {
    chip: 'К получателю',
    helper: 'Следуйте по маршруту до адреса доставки.',
    primaryAction: 'Доставлено',
  },
}

export function useOrderState() {
  const {
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
  } = useOrdersState()

  const stageMeta = useMemo(() => {
    if (!hasActiveOrder || !activeOrder) {
      return null
    }

    const current = ORDER_STAGE_META[orderStage] ?? ORDER_STAGE_META[ORDER_STAGES.TO_PICKUP]
    const eta = orderStage === ORDER_STAGES.TO_CUSTOMER ? activeOrder.deliveryEta : activeOrder.pickupEta

    return {
      ...current,
      eta,
    }
  }, [activeOrder, hasActiveOrder, orderStage])

  return {
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    stageMeta,
    acceptIncomingOrder,
    advanceOrderStage,
    cancelOrder,
  }
}

export { ORDER_STAGES }
