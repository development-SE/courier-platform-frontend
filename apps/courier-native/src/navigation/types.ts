import { SCREEN_IDS, ROOT_ROUTES } from '../constants/screenIds'

export type RootStackParamList = {
  [SCREEN_IDS.SIGN_IN]: undefined
  [SCREEN_IDS.SIGN_UP]: undefined
  [ROOT_ROUTES.MAIN_TABS]: undefined
  [SCREEN_IDS.ORDER_DETAIL]: { orderId: string }
}

export type MainTabParamList = {
  [SCREEN_IDS.DASHBOARD]: undefined
  [SCREEN_IDS.ORDERS]: undefined
  [SCREEN_IDS.SLOTS]: undefined
  [SCREEN_IDS.MONEY]: undefined
  [SCREEN_IDS.MESSAGES]: undefined
  [SCREEN_IDS.PROFILE]: undefined
}
