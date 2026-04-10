import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { LoginScreen } from '../screens/Auth/LoginScreen'
import { RegisterScreen } from '../screens/Auth/RegisterScreen'
import { HomeScreen } from '../screens/Home/HomeScreen'
import { OrdersScreen } from '../screens/Orders/OrdersScreen'
import { CreateOrderScreen } from '../screens/Orders/CreateOrderScreen'
import { OrderTrackingScreen } from '../screens/Orders/OrderTrackingScreen'
import { ProfileScreen } from '../screens/Profile/ProfileScreen'

import { PersonalInfoScreen } from '../screens/Profile/PersonalInfoScreen'
import { SavedAddressesScreen } from '../screens/Profile/SavedAddressesScreen'
import { SettingsScreen } from '../screens/Profile/SettingsScreen'
import { SupportScreen } from '../screens/Profile/SupportScreen'

const Stack = createNativeStackNavigator()

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeTab" component={HomeScreen} />
    <Stack.Screen name="OrdersTab" component={OrdersScreen} />
    <Stack.Screen name="ProfileTab" component={ProfileScreen} />
  </Stack.Navigator>
)

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Main" component={MainStack} />
    <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />

    <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
    <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
  </Stack.Navigator>
)