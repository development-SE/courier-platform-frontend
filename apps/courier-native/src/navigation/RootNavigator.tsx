import { useEffect } from 'react'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { SCREEN_IDS, ROOT_ROUTES } from '../constants/screenIds'
import type { MainTabParamList, RootStackParamList } from './types'
import { appTheme } from '../theme/appTheme'
import { useAuthStore } from '../store/authStore'
import { SignInScreen } from '../screens/auth/SignInScreen'
import { SignUpScreen } from '../screens/auth/SignUpScreen'
import { DashboardScreen } from '../screens/dashboard/DashboardScreen'
import { OrdersScreen } from '../screens/orders/OrdersScreen'
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen'
import { SlotsScreen } from '../screens/slots/SlotsScreen'
import { MoneyScreen } from '../screens/money/MoneyScreen'
import { MessagesScreen } from '../screens/messages/MessagesScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { Screen } from '../ui/Screen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appTheme.colors.background,
    card: '#10111a',
    text: appTheme.colors.text,
    border: '#1f2030',
    primary: appTheme.colors.primary,
  },
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#1f2030',
          backgroundColor: '#10111a',
        },
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
      }}
    >
      <Tabs.Screen
        name={SCREEN_IDS.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name={SCREEN_IDS.ORDERS}
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name={SCREEN_IDS.SLOTS}
        component={SlotsScreen}
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name={SCREEN_IDS.MONEY}
        component={MoneyScreen}
        options={{
          title: 'Money',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name={SCREEN_IDS.MESSAGES}
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name={SCREEN_IDS.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  )
}

function SessionRestoreScreen() {
  return <Screen title="SwiftDeliver Courier" subtitle="Restoring session..." />
}

export function RootNavigator() {
  const authorized = useAuthStore(state => state.authorized)
  const status = useAuthStore(state => state.status)
  const hydrate = useAuthStore(state => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (status !== 'ready') {
    return <SessionRestoreScreen />
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: appTheme.colors.background },
        }}
      >
        {authorized ? (
          <>
            <Stack.Screen name={ROOT_ROUTES.MAIN_TABS} component={MainTabs} />
            <Stack.Screen name={SCREEN_IDS.ORDER_DETAIL} component={OrderDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name={SCREEN_IDS.SIGN_IN} component={SignInScreen} />
            <Stack.Screen name={SCREEN_IDS.SIGN_UP} component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
