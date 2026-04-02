import { ROUTES, SCREEN_IDS, buildOrderDetailRoute } from '../constants/routes'

export function createWebAppNavigator(navigate) {
  return {
    openSignIn(options) {
      navigate(ROUTES.SIGN_IN, options)
    },
    openDashboard(options) {
      navigate(ROUTES.DASHBOARD, options)
    },
    openSlots(options) {
      navigate(ROUTES.SLOTS, options)
    },
    openMessages(options) {
      navigate(ROUTES.MESSAGES, options)
    },
    openProfileIdentity(options) {
      navigate(ROUTES.PROFILE_IDENTITY, options)
    },
    openOrderDetails(orderId, options) {
      navigate(buildOrderDetailRoute(orderId), options)
    },
  }
}

export function createNativeAppNavigator(navigation) {
  return {
    openSignIn(options) {
      navigation.navigate(SCREEN_IDS.SIGN_IN, options)
    },
    openDashboard(options) {
      navigation.navigate(SCREEN_IDS.DASHBOARD, options)
    },
    openSlots(options) {
      navigation.navigate(SCREEN_IDS.SLOTS, options)
    },
    openMessages(options) {
      navigation.navigate(SCREEN_IDS.MESSAGES, options)
    },
    openProfileIdentity(options) {
      navigation.navigate(SCREEN_IDS.PROFILE_IDENTITY, options)
    },
    openOrderDetails(orderId, options) {
      navigation.navigate(SCREEN_IDS.ORDER_DETAIL, { orderId: String(orderId), ...options })
    },
  }
}
