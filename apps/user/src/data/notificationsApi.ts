import { NativeModules, Platform } from 'react-native'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import * as Localization from 'expo-localization'
import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  error?: { code: string; message: string }
}

export type DeviceTokenPayload = {
  deviceId: string
  platform: 'IOS' | 'ANDROID'
  provider: 'FCM'
  pushToken: string
  appVersion: string
  locale: string
}

type RemoteMessageLike = {
  messageId?: string
  sentTime?: number
  data?: Record<string, string | undefined>
  notification?: {
    title?: string | null
    body?: string | null
  } | null
}

type PushNotificationListenerHandlers = {
  onForegroundMessage?: (message: RemoteMessageLike) => void | Promise<void>
  onNotificationOpened?: (message: RemoteMessageLike) => void | Promise<void>
  onInitialNotification?: (message: RemoteMessageLike) => void | Promise<void>
}

function getPlatform() {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
}

function getLocale() {
  return Localization.getLocales()[0]?.languageCode ?? 'en'
}

async function getDeviceId() {
  if (Platform.OS === 'android') {
    return Application.getAndroidId() ?? 'android-unknown-device'
  }

  if (Platform.OS === 'ios') {
    return (await Application.getIosIdForVendorAsync()) ?? 'ios-unknown-device'
  }

  return `${Platform.OS}-unknown-device`
}

async function getFirebaseMessagingToken() {
  const messagingFactory = await getFirebaseMessagingFactory()
  if (!messagingFactory) {
    throw new Error('Expo Go detected. FCM token registration skipped.')
  }

  const messagingClient = messagingFactory()
  const permission = await messagingClient.requestPermission()
  const isAuthorized = permission === 1 || permission === 2

  if (!isAuthorized) {
    throw new Error('Push notification permission was not granted.')
  }

  if (Platform.OS === 'ios') {
    await messagingClient.registerDeviceForRemoteMessages()
  }

  const fcmToken = await messagingClient.getToken()

  if (!fcmToken || !fcmToken.includes(':')) {
    console.log('[Notifications] Firebase Messaging returned token:', fcmToken)
  }

  return fcmToken
}

async function getFirebaseMessagingFactory() {
  if (!NativeModules.RNFBAppModule) {
    return null
  }

  const { default: messaging } = await import('@react-native-firebase/messaging')
  if (typeof messaging !== 'function') {
    throw new Error(
      'Firebase Messaging native module is unavailable. Build and install a development/native app to get FCM tokens.',
    )
  }

  return messaging
}

export async function buildDeviceTokenPayload(): Promise<DeviceTokenPayload> {
  let fcmToken = 'dummy-fcm-token-for-simulator'
  let deviceId = 'dummy-device-id-for-simulator'

  try {
    deviceId = await getDeviceId()
    if (Device.isDevice) {
      fcmToken = await getFirebaseMessagingToken()
    } else {
      deviceId = `sim-${Platform.OS}-${deviceId}`
      fcmToken = `ExponentPushToken[mock-token-${deviceId}]`
    }
  } catch (err) {
    console.log('[Notifications] Falling back to mock token due to:', err)
    deviceId = `sim-${Platform.OS}-${deviceId}`
    fcmToken = `ExponentPushToken[mock-token-${deviceId}]`
  }

  return {
    deviceId,
    platform: getPlatform(),
    provider: 'FCM',
    pushToken: fcmToken,
    appVersion: Application.nativeApplicationVersion ?? '1.0.0',
    locale: getLocale(),
  }
}

export async function registerDeviceToken(accessToken: string) {
  const payload = await buildDeviceTokenPayload()

  console.log('[Notifications] Device token payload:', JSON.stringify(payload, null, 2))

  const response = await apiRequest<ApiResponse<null>>('/api/v1/notifications/devices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: payload,
  })

  if (response.ok) {
    console.log('[Notifications] Device token response:', JSON.stringify(response.data, null, 2))
  } else {
    console.log('[Notifications] Device token registration failed:', response.error)
  }

  return response
}

export async function setupPushNotificationListeners(
  handlers: PushNotificationListenerHandlers,
) {
  const messagingFactory = await getFirebaseMessagingFactory()
  if (!messagingFactory) {
    return () => {}
  }

  const messagingClient = messagingFactory()

  const foregroundUnsubscribe = messagingClient.onMessage(async remoteMessage => {
    await handlers.onForegroundMessage?.(remoteMessage as RemoteMessageLike)
  })

  const openUnsubscribe = messagingClient.onNotificationOpenedApp(async remoteMessage => {
    await handlers.onNotificationOpened?.(remoteMessage as RemoteMessageLike)
  })

  const initialNotification = await messagingClient.getInitialNotification()
  if (initialNotification) {
    await handlers.onInitialNotification?.(initialNotification as RemoteMessageLike)
  }

  return () => {
    foregroundUnsubscribe()
    openUnsubscribe()
  }
}
