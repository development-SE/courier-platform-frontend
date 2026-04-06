import { SCREEN_IDS } from '../../constants/routes'

export const PROFILE_NAV_ITEMS = Object.freeze([
  { screenId: SCREEN_IDS.PROFILE_STATUS, label: 'Статус на линии' },
  { screenId: SCREEN_IDS.PROFILE_TRANSPORT, label: 'Тип транспорта' },
  { screenId: SCREEN_IDS.PROFILE_IDENTITY, label: 'Проверка личности' },
  { screenId: SCREEN_IDS.PROFILE_PARK_ACCESS, label: 'Доступ к парку' },
  { screenId: SCREEN_IDS.PROFILE_PAYOUT_ACCOUNT, label: 'Счет для выплат' },
  { screenId: SCREEN_IDS.PROFILE_PAYOUT_HISTORY, label: 'История выплат' },
  { screenId: SCREEN_IDS.PROFILE_NOTIFICATIONS, label: 'Уведомления' },
  { screenId: SCREEN_IDS.PROFILE_LANGUAGE, label: 'Язык' },
])

export const PROFILE_SCREEN_TITLE = Object.freeze(
  PROFILE_NAV_ITEMS.reduce((accumulator, item) => {
    accumulator[item.screenId] = item.label
    return accumulator
  }, {}),
)
