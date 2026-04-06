import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SCREEN_IDS } from '../../constants/routes'
import { OrdersProvider } from '../../state/OrdersContext'
import { createNativeAppNavigator } from '../appNavigator'
import { PROFILE_STACK_SCREENS } from './screenConfig'
import { NativeOrdersScreen } from './screens/NativeOrdersScreen'
import { NativeMessagesScreen } from './screens/NativeMessagesScreen'
import { NativePlaceholderScreen } from './screens/NativePlaceholderScreen'
import { NativeDashboardScreen } from './screens/NativeDashboardScreen'
import { NativeOrderDetailScreen } from './screens/NativeOrderDetailScreen'
import { NativeProfileScreen } from './screens/NativeProfileScreen'
import { NativeProfileDetailScreen } from './screens/NativeProfileDetailScreen'
import { isAuthorized, signInWithCredentials, signOut } from '../../services/authService'
import {
  getNativeAuthStorageBackendType,
  hydrateAuthStateFromNativeStorage,
  persistAuthStateToNativeStorage,
} from '../../platform/native/authStoragePersistence'
import { AUTH_STORAGE_KEY } from '../../mock/auth'

const Stack = createNativeStackNavigator()
const Tabs = createBottomTabNavigator()
const MAIN_TABS_ROUTE = 'MainTabsRoute'

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0b0b0f',
    card: '#10111a',
    text: '#f2f3f7',
    border: '#1f2030',
    primary: '#cd5e3d',
  },
}

function NativeSignInScreen({ navigation, onSignedIn }) {
  const [login, setLogin] = useState('courier')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const appNavigator = useMemo(
    () => createNativeAppNavigator(navigation),
    [navigation],
  )

  const handleSignIn = () => {
    setError('')
    const success = signInWithCredentials(login, password)

    if (!success) {
      setError('Неверный логин или пароль')
      return
    }

    onSignedIn()
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <Text style={styles.authTitle}>SwiftDeliver Courier</Text>
      <Text style={styles.authSubtitle}>Войдите, чтобы открыть рабочие RN-экраны.</Text>

      <View style={styles.authForm}>
        <TextInput
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Логин"
          placeholderTextColor="#8589a0"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Пароль"
          placeholderTextColor="#8589a0"
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable onPress={handleSignIn} style={styles.authButton}>
          <Text style={styles.authButtonText}>Войти</Text>
        </Pressable>

        <Pressable onPress={() => appNavigator.openSignIn()} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Сбросить экран входа</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate(SCREEN_IDS.SIGN_UP)} style={styles.linkBtn}>
          <Text style={styles.linkBtnText}>Регистрация</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function NativeSignUpScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.authScreen}>
      <Text style={styles.authTitle}>Регистрация</Text>
      <Text style={styles.authSubtitle}>Экран регистрации будет перенесен на следующем этапе.</Text>
      <Pressable onPress={() => navigation.navigate(SCREEN_IDS.SIGN_IN)} style={styles.authButton}>
        <Text style={styles.authButtonText}>Назад ко входу</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function MainTabsNavigator({ onSignOut }) {
  return (
    <Tabs.Navigator
      initialRouteName={SCREEN_IDS.ORDERS}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#cd5e3d',
        tabBarInactiveTintColor: '#9da2b6',
      }}
    >
      <Tabs.Screen
        name={SCREEN_IDS.DASHBOARD}
        component={NativeDashboardScreen}
        options={{ title: 'Главная' }}
      />

      <Tabs.Screen
        name={SCREEN_IDS.ORDERS}
        component={NativeOrdersScreen}
        options={{ title: 'Заказы' }}
      />

      <Tabs.Screen
        name={SCREEN_IDS.SLOTS}
        options={{ title: 'Слоты' }}
      >
        {() => <NativePlaceholderScreen title="Слоты" />}
      </Tabs.Screen>

      <Tabs.Screen
        name={SCREEN_IDS.MONEY}
        options={{ title: 'Деньги' }}
      >
        {() => <NativePlaceholderScreen title="Деньги" />}
      </Tabs.Screen>

      <Tabs.Screen
        name={SCREEN_IDS.MESSAGES}
        component={NativeMessagesScreen}
        options={{ title: 'Сообщения' }}
      />

      <Tabs.Screen
        name={SCREEN_IDS.PROFILE}
        options={{ title: 'Профиль' }}
      >
        {() => <NativeProfileScreen onSignOut={onSignOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  )
}

export function NativeAppShell() {
  const [authReady, setAuthReady] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [storageBackend, setStorageBackend] = useState(null)

  useEffect(() => {
    let isMounted = true

    const hydrateAuth = async () => {
      await hydrateAuthStateFromNativeStorage(AUTH_STORAGE_KEY)
      const backendType = await getNativeAuthStorageBackendType()
      if (!isMounted) return

      setStorageBackend(backendType)
      setAuthorized(isAuthorized())
      setAuthReady(true)
    }

    void hydrateAuth()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    void persistAuthStateToNativeStorage(AUTH_STORAGE_KEY)
  }, [authReady, authorized])

  const handleSignedIn = () => {
    setAuthorized(true)
  }

  const handleSignOut = () => {
    signOut()
    setAuthorized(false)
  }

  if (!authReady) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <Text style={styles.authTitle}>SwiftDeliver Courier</Text>
        <Text style={styles.authSubtitle}>Восстанавливаем сессию...</Text>
      </SafeAreaView>
    )
  }

  return (
    <OrdersProvider>
      <NavigationContainer theme={NAV_THEME}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: styles.stackContent,
          }}
        >
          {authorized ? (
            <>
              <Stack.Screen name={MAIN_TABS_ROUTE}>
                {() => <MainTabsNavigator onSignOut={handleSignOut} />}
              </Stack.Screen>
              <Stack.Screen name={SCREEN_IDS.ORDER_DETAIL} component={NativeOrderDetailScreen} />
              {PROFILE_STACK_SCREENS.map(screenId => (
                <Stack.Screen
                  key={screenId}
                  name={screenId}
                  component={NativeProfileDetailScreen}
                />
              ))}
            </>
          ) : (
            <>
              <Stack.Screen name={SCREEN_IDS.SIGN_IN}>
                {props => <NativeSignInScreen {...props} onSignedIn={handleSignedIn} />}
              </Stack.Screen>
              <Stack.Screen name={SCREEN_IDS.SIGN_UP} component={NativeSignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {storageBackend ? (
        <View style={styles.storageBadge}>
          <Text style={styles.storageBadgeText}>storage: {storageBackend}</Text>
        </View>
      ) : null}
    </OrdersProvider>
  )
}

const styles = StyleSheet.create({
  stackContent: {
    backgroundColor: '#0b0b0f',
  },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#1f2030',
    backgroundColor: '#10111a',
  },
  authScreen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0f',
    gap: 12,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f4f5f9',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#9ca1b7',
    textAlign: 'center',
  },
  authForm: {
    width: '100%',
    maxWidth: 360,
    gap: 10,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d43',
    backgroundColor: '#111320',
    color: '#eef0f8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    color: '#ff808f',
    fontSize: 13,
  },
  authButton: {
    marginTop: 4,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#cd5e3d',
  },
  authButtonText: {
    color: '#fff7f3',
    fontSize: 16,
    fontWeight: '700',
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  ghostBtnText: {
    color: '#9ca1b7',
    fontSize: 12,
  },
  linkBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  linkBtnText: {
    color: '#dcb39f',
    fontSize: 13,
    fontWeight: '600',
  },
  storageBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(16,17,26,0.84)',
    borderWidth: 1,
    borderColor: '#23243a',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storageBadgeText: {
    color: '#9ca1b7',
    fontSize: 10,
    fontWeight: '600',
  },
})
