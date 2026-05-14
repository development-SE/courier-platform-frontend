import { registerRootComponent } from 'expo'
import { NativeModules } from 'react-native'
import App from './App'
import { appendPushInboxNotificationFromRemoteMessage } from './src/data/notificationsInbox'

if (NativeModules.RNFBAppModule) {
  const messaging = require('@react-native-firebase/messaging').default

  messaging().setBackgroundMessageHandler(async (remoteMessage: unknown) => {
    await appendPushInboxNotificationFromRemoteMessage(remoteMessage as {
      messageId?: string
      sentTime?: number
      data?: Record<string, string | undefined>
      notification?: { title?: string | null; body?: string | null } | null
    })
  })
}

registerRootComponent(App)
