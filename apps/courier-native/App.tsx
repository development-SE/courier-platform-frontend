import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AppProviders } from './src/providers/AppProviders'
import { RootNavigator } from './src/navigation/RootNavigator'
import { configurePushNotifications } from './src/platform/pushNotifications'
import { appTheme } from './src/theme/appTheme'

export default function App() {
  useEffect(() => {
    void configurePushNotifications()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: appTheme.colors.background }}>
      <AppProviders>
        <StatusBar style="light" />
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  )
}
