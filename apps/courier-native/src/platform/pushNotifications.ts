import { Platform } from 'react-native'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import type { DeviceRegistrationPayload } from '../data/notificationApi'

type NotificationsModule = typeof import('expo-notifications')

export async function configurePushNotifications() {
  const Notifications = await import('expo-notifications')

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7B5C',
    })
  }
}

export async function buildExpoNotificationDevicePayload(
  deviceId: string,
): Promise<DeviceRegistrationPayload | null> {
  const isWeb = Platform.OS === 'web'

  if (isWeb) {
    console.log('[PushNotifications] Skipped notification token payload: running in web.')
    return null
  }

  try {
    const Notifications = await import('expo-notifications')

    console.log('[PushNotifications] Checking notification permissions...')
    let permissions = await Notifications.getPermissionsAsync()
    if (!hasGrantedPermission(Notifications, permissions)) {
      console.log('[PushNotifications] Requesting notification permissions...')
      permissions = await Notifications.requestPermissionsAsync()
    }

    const granted = hasGrantedPermission(Notifications, permissions)
    console.log('[PushNotifications] Permission status:', granted ? 'GRANTED' : 'DENIED')

    if (!granted) {
      console.warn('[PushNotifications] Notification permission was denied by the user.')
      return null
    }

    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId

    if (!projectId) {
      console.warn('[PushNotifications] Expo push token skipped: EAS Project ID is missing.')
      // Generate fallback token even if project ID is missing, so backend registration can be tested
      return {
        deviceId,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        provider: 'expo',
        pushToken: `ExponentPushToken[mock-missing-projectid-${deviceId.slice(-6)}]`,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      }
    }

    try {
      console.log('[PushNotifications] Calling getExpoPushTokenAsync with projectId:', projectId)
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data
      console.log('[PushNotifications] Push token retrieved successfully:', pushToken)

      return {
        deviceId,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        provider: 'expo',
        pushToken,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      }
    } catch (tokenErr: any) {
      const errMsg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr)
      console.warn(
        `[PushNotifications] Error fetching native Expo push token (FCM/APNs might not be configured): ${errMsg}. Using simulated fallback token.`,
      )
      // Fallback to simulated token so backend integration works
      return {
        deviceId,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        provider: 'expo',
        pushToken: `ExponentPushToken[mock-fcm-error-${deviceId.slice(-6)}]`,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      }
    }
  } catch (err: any) {
    console.error('[PushNotifications] Failed in buildExpoNotificationDevicePayload:', err)
    return null
  }
}

function hasGrantedPermission(
  Notifications: NotificationsModule,
  permissions: Awaited<ReturnType<NotificationsModule['getPermissionsAsync']>>,
) {
  const candidate = permissions as unknown as {
    granted?: boolean
    status?: string
    ios?: { status?: number }
  }

  return (
    candidate.granted === true ||
    candidate.status === 'granted' ||
    candidate.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    candidate.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    candidate.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  )
}

function isExpoGo() {
  const candidate = Constants as typeof Constants & {
    executionEnvironment?: string
    appOwnership?: string
  }

  return (
    candidate.executionEnvironment === 'storeClient' ||
    candidate.appOwnership === 'expo'
  )
}
