import { useWebAppNavigator } from '../../navigation/useWebAppNavigator'
import { ORDER_FILTERS, useOrdersListModel } from '../../features/orders/useOrdersListModel'

export function useOrdersViewModel() {
  const appNavigator = useWebAppNavigator()
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
