import { ORDER_FILTERS, useOrdersListModel } from '../../../features/orders/useOrdersListModel'
import { useNativeAppNavigator } from '../useNativeAppNavigator'

export function useNativeOrdersViewModel() {
  const appNavigator = useNativeAppNavigator()
  const ordersModel = useOrdersListModel()

  const openOrderDetails = orderId => {
    appNavigator.openOrderDetails(orderId)
  }

  return {
    ...ordersModel,
    openOrderDetails,
  }
}

export { ORDER_FILTERS }
