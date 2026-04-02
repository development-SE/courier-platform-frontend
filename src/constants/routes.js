export const ROUTES = Object.freeze({
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  SLOTS: '/slots',
  MONEY: '/money',
  MESSAGES: '/messages',
  PROFILE: '/profile',
  PROFILE_STATUS: '/profile/status',
  PROFILE_TRANSPORT: '/profile/transport',
  PROFILE_IDENTITY: '/profile/identity',
  PROFILE_PARK_ACCESS: '/profile/park-access',
  PROFILE_PAYOUT_ACCOUNT: '/profile/payout-account',
  PROFILE_PAYOUT_HISTORY: '/profile/payout-history',
  PROFILE_NOTIFICATIONS: '/profile/notifications',
  PROFILE_LANGUAGE: '/profile/language',
  ACTIVE_ORDER: '/orders/250818-2007978',
})

export const SCREEN_IDS = Object.freeze({
  SIGN_IN: 'SignInScreen',
  SIGN_UP: 'SignUpScreen',
  DASHBOARD: 'DashboardScreen',
  ORDERS: 'OrdersScreen',
  ORDER_DETAIL: 'OrderDetailScreen',
  SLOTS: 'SlotsScreen',
  MONEY: 'MoneyScreen',
  MESSAGES: 'MessagesScreen',
  PROFILE: 'ProfileScreen',
  PROFILE_STATUS: 'ProfileStatusScreen',
  PROFILE_TRANSPORT: 'ProfileTransportScreen',
  PROFILE_IDENTITY: 'ProfileIdentityScreen',
  PROFILE_PARK_ACCESS: 'ProfileParkAccessScreen',
  PROFILE_PAYOUT_ACCOUNT: 'ProfilePayoutAccountScreen',
  PROFILE_PAYOUT_HISTORY: 'ProfilePayoutHistoryScreen',
  PROFILE_NOTIFICATIONS: 'ProfileNotificationsScreen',
  PROFILE_LANGUAGE: 'ProfileLanguageScreen',
})

export const FULL_SCREEN_ROUTES = Object.freeze([
  ROUTES.DASHBOARD,
])

export function buildOrderDetailRoute(orderId) {
  return ROUTES.ORDER_DETAIL.replace(':id', encodeURIComponent(String(orderId)))
}
