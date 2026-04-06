import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { AppProviders } from './src/providers/AppProviders'
import { RootNavigator } from './src/navigation/RootNavigator'
import { appTheme } from './src/theme/appTheme'

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: appTheme.colors.background }}>
      <AppProviders>
        <StatusBar style="light" />
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  )
}
