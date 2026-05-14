import AsyncStorage from '@react-native-async-storage/async-storage'

export type PushInboxCategory = 'Orders' | 'Promotions' | 'System'

export type PushInboxNotification = {
  id: string
  title: string
  message: string
  createdAt: string
  unread: boolean
  category: PushInboxCategory
  orderId?: string
  serviceType?: string
}

type RemoteMessageLike = {
  messageId?: string
  sentTime?: number
  data?: Record<string, string | undefined> | undefined
  notification?: {
    title?: string | null
    body?: string | null
  } | null
}

const NOTIFICATIONS_STORAGE_KEY = 'swiftdeliver.user.notifications.v1'
const MAX_NOTIFICATIONS = 50

function isPushInboxCategory(value: string): value is PushInboxCategory {
  return value === 'Orders' || value === 'Promotions' || value === 'System'
}

function isPushInboxNotification(value: unknown): value is PushInboxNotification {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PushInboxNotification>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.unread === 'boolean' &&
    typeof candidate.category === 'string' &&
    isPushInboxCategory(candidate.category)
  )
}

function normalizeCategory(data?: Record<string, string | undefined>): PushInboxCategory {
  const rawValue = [
    data?.category,
    data?.type,
    data?.channel,
    data?.topic,
  ]
    .find(Boolean)
    ?.toLowerCase()

  if (rawValue?.includes('promo')) {
    return 'Promotions'
  }

  if (rawValue?.includes('order') || data?.orderId) {
    return 'Orders'
  }

  return 'System'
}

function buildNotificationId(message: RemoteMessageLike) {
  if (message.messageId?.trim()) {
    return message.messageId.trim()
  }

  if (message.data?.id?.trim()) {
    return message.data.id.trim()
  }

  const title = message.notification?.title?.trim() ?? message.data?.title?.trim() ?? 'push'
  const timestamp = message.sentTime ?? Date.now()
  return `push-${timestamp}-${title.replace(/\s+/g, '-').toLowerCase()}`
}

function buildNotificationTitle(message: RemoteMessageLike) {
  return (
    message.notification?.title?.trim() ||
    message.data?.title?.trim() ||
    (message.data?.orderId ? 'Order update' : 'Notification')
  )
}

function buildNotificationBody(message: RemoteMessageLike) {
  return (
    message.notification?.body?.trim() ||
    message.data?.body?.trim() ||
    message.data?.message?.trim() ||
    'You received a new notification.'
  )
}

async function saveStoredPushNotifications(notifications: PushInboxNotification[]) {
  try {
    await AsyncStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
    )
  } catch {
    // Ignore local persistence failures and keep runtime flow alive.
  }
}

export async function loadStoredPushNotifications() {
  try {
    const rawValue = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(rawValue)
    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isPushInboxNotification).sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  } catch {
    return []
  }
}

export async function getUnreadPushNotificationsCount() {
  const notifications = await loadStoredPushNotifications()
  return notifications.filter(notification => notification.unread).length
}

export async function appendPushInboxNotification(notification: PushInboxNotification) {
  const currentNotifications = await loadStoredPushNotifications()
  const nextNotifications = [
    notification,
    ...currentNotifications.filter(currentNotification => currentNotification.id !== notification.id),
  ]

  await saveStoredPushNotifications(nextNotifications)
  return notification
}

export async function appendPushInboxNotificationFromRemoteMessage(
  message: RemoteMessageLike,
  options?: { unread?: boolean },
) {
  const notification: PushInboxNotification = {
    id: buildNotificationId(message),
    title: buildNotificationTitle(message),
    message: buildNotificationBody(message),
    createdAt: new Date(message.sentTime ?? Date.now()).toISOString(),
    unread: options?.unread ?? true,
    category: normalizeCategory(message.data),
    orderId: message.data?.orderId?.trim() || undefined,
    serviceType: message.data?.serviceType?.trim() || undefined,
  }

  return appendPushInboxNotification(notification)
}

export async function markPushNotificationRead(notificationId: string) {
  const notifications = await loadStoredPushNotifications()
  const nextNotifications = notifications.map(notification =>
    notification.id === notificationId
      ? {
          ...notification,
          unread: false,
        }
      : notification,
  )

  await saveStoredPushNotifications(nextNotifications)
}

export async function markAllPushNotificationsRead() {
  const notifications = await loadStoredPushNotifications()
  const nextNotifications = notifications.map(notification => ({
    ...notification,
    unread: false,
  }))

  await saveStoredPushNotifications(nextNotifications)
}

export async function clearStoredPushNotifications() {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY)
  } catch {
    // Ignore local cleanup errors.
  }
}

export function formatPushNotificationTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime()
  if (Number.isNaN(timestamp)) {
    return 'Just now'
  }

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return 'Yesterday'
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  })
}
