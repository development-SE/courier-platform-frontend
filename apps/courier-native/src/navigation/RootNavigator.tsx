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
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen'
import { PendingApprovalScreen } from '../screens/onboarding/PendingApprovalScreen'
import { PostLoginRouter } from '../screens/auth/PostLoginRouter'

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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  [SCREEN_IDS.DASHBOARD]: { active: 'home',          inactive: 'home-outline' },
  [SCREEN_IDS.ORDERS]:    { active: 'list',           inactive: 'list-outline' },
  [SCREEN_IDS.SLOTS]:     { active: 'time',           inactive: 'time-outline' },
  [SCREEN_IDS.MONEY]:     { active: 'wallet',         inactive: 'wallet-outline' },
  [SCREEN_IDS.MESSAGES]:  { active: 'chatbubble',     inactive: 'chatbubble-outline' },
  [SCREEN_IDS.PROFILE]:   { active: 'person',         inactive: 'person-outline' },
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#1f2030',
          backgroundColor: '#10111a',
        },
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name]
          const iconName = icons
            ? (focused ? icons.active : icons.inactive)
            : 'ellipse-outline'
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tabs.Screen name={SCREEN_IDS.DASHBOARD} component={DashboardScreen} options={{ title: 'Home' }} />
      <Tabs.Screen name={SCREEN_IDS.ORDERS}    component={OrdersScreen}    options={{ title: 'Orders' }} />
      <Tabs.Screen name={SCREEN_IDS.SLOTS}     component={SlotsScreen}     options={{ title: 'Slots' }} />
      <Tabs.Screen name={SCREEN_IDS.MONEY}     component={MoneyScreen}     options={{ title: 'Money' }} />
      <Tabs.Screen name={SCREEN_IDS.MESSAGES}  component={MessagesScreen}  options={{ title: 'Messages' }} />
      <Tabs.Screen name={SCREEN_IDS.PROFILE}   component={ProfileScreen}   options={{ title: 'Profile' }} />
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
            <Stack.Screen
              name={SCREEN_IDS.POST_LOGIN_ROUTER}
              component={PostLoginRouter}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name={ROOT_ROUTES.MAIN_TABS} component={MainTabs} />
            <Stack.Screen name={SCREEN_IDS.ORDER_DETAIL} component={OrderDetailScreen} />
            <Stack.Screen
              name={SCREEN_IDS.ONBOARDING}
              component={OnboardingScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name={SCREEN_IDS.PENDING_APPROVAL}
              component={PendingApprovalScreen}
              options={{ gestureEnabled: false }}
            />
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