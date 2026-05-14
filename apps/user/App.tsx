import { useCallback, useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { loginUser, refreshUserSession, registerUser } from './src/data/authApi'
import { createMockFoodOrder, type MockFoodCheckoutItem } from './src/data/mockFoodOrders'
import {
  registerDeviceToken,
  setupPushNotificationListeners,
} from './src/data/notificationsApi'
import {
  appendPushInboxNotificationFromRemoteMessage,
  clearStoredPushNotifications,
  getUnreadPushNotificationsCount,
  markPushNotificationRead,
  type PushInboxNotification,
} from './src/data/notificationsInbox'
import type { UserOrder } from './src/data/ordersApi'
import {
  clearStoredUserSession,
  loadStoredUserSession,
  saveStoredUserSession,
  type StoredUserSession,
} from './src/data/sessionStorage'
import { UserAddressScreen } from './src/screens/address/UserAddressScreen'
import { UserSignInScreen } from './src/screens/auth/UserSignInScreen'
import { UserSignUpScreen } from './src/screens/auth/UserSignUpScreen'
import { UserCartScreen } from './src/screens/cart/UserCartScreen'
import { RestaurantDetailScreen } from './src/screens/home/RestaurantDetailScreen'
import { UserHomeScreen } from './src/screens/home/UserHomeScreen'
import { UserNotificationsScreen } from './src/screens/notifications/UserNotificationsScreen'
import { UserOrderTrackingScreen } from './src/screens/orders/UserOrderTrackingScreen'
import { UserOrdersScreen } from './src/screens/orders/UserOrdersScreen'
import { UserParcelFlowScreen } from './src/screens/parcel/UserParcelFlowScreen'
import { UserProfileScreen } from './src/screens/profile/UserProfileScreen'
import { UserSearchScreen } from './src/screens/search/UserSearchScreen'

type AuthSession = StoredUserSession

function isSessionExpired(expiresAt?: number) {
  if (typeof expiresAt !== 'number') {
    return false
  }

  return expiresAt <= Math.floor(Date.now() / 1000) + 30
}

export default function App() {
  const { width } = useWindowDimensions()
  const [authScreen, setAuthScreen] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [mainTab, setMainTab] = useState<'home' | 'orders' | 'cart' | 'profile'>('home')
  const [restaurantInitialScreen, setRestaurantInitialScreen] = useState<'menu' | 'cart'>('menu')
  const [overlayScreen, setOverlayScreen] = useState<
    'notifications' | 'search' | 'address' | 'restaurant' | 'parcel' | 'order-tracking' | null
  >(null)
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [mockFoodOrders, setMockFoodOrders] = useState<UserOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null)
  const [ordersReloadKey, setOrdersReloadKey] = useState(0)
  const [notificationsReloadKey, setNotificationsReloadKey] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [foregroundNotification, setForegroundNotification] = useState<PushInboxNotification | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSessionBootstrapping, setIsSessionBootstrapping] = useState(true)
  const [session, setSession] = useState<AuthSession | null>(null)
  const transitionProgress = useRef(new Animated.Value(0)).current
  const authEntryProgress = useRef(new Animated.Value(0)).current
  const profileEntryProgress = useRef(new Animated.Value(0)).current
  const mockFoodOrderTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({})
  const foregroundNotificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Animated.timing(transitionProgress, {
      toValue: overlayScreen ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [overlayScreen, transitionProgress])

  useEffect(() => {
    if (!session) {
      setCartItems({})
      setRestaurantInitialScreen('menu')
      authEntryProgress.setValue(0)
      profileEntryProgress.setValue(0)
      return
    }

    Animated.timing(authEntryProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [authEntryProgress, profileEntryProgress, session])

  useEffect(() => {
    if (mainTab !== 'profile') {
      profileEntryProgress.setValue(0)
      return
    }

    profileEntryProgress.setValue(0)
    Animated.timing(profileEntryProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [mainTab, profileEntryProgress])

  useEffect(() => {
    let isActive = true

    const bootstrapSession = async () => {
      const storedSession = await loadStoredUserSession()

      if (!isActive) {
        return
      }

      if (!storedSession) {
        setIsSessionBootstrapping(false)
        return
      }

      let nextSession = storedSession

      if (isSessionExpired(storedSession.expiresAt)) {
        const refreshResponse = await refreshUserSession(storedSession.refreshToken)

        if (!isActive) {
          return
        }

        if (
          !refreshResponse.ok ||
          !refreshResponse.data.success ||
          !refreshResponse.data.data?.accessToken ||
          !refreshResponse.data.data?.refreshToken
        ) {
          await clearStoredUserSession()

          if (!isActive) {
            return
          }

          setSession(null)
          setIsSessionBootstrapping(false)
          return
        }

        nextSession = {
          ...storedSession,
          accessToken: refreshResponse.data.data.accessToken,
          refreshToken: refreshResponse.data.data.refreshToken,
          expiresAt: refreshResponse.data.data.expiresAt,
        }

        await saveStoredUserSession(nextSession)

        if (!isActive) {
          return
        }
      }

      setSession(nextSession)
      setMainTab('home')
      setOverlayScreen(null)
      setIsSessionBootstrapping(false)
    }

    void bootstrapSession()

    return () => {
      isActive = false
    }
  }, [])

  const clearMockFoodOrderTimers = useCallback(() => {
    Object.values(mockFoodOrderTimersRef.current).forEach(timers => {
      timers.forEach(timer => clearTimeout(timer))
    })

    mockFoodOrderTimersRef.current = {}
  }, [])

  useEffect(() => {
    return () => {
      clearMockFoodOrderTimers()
      if (foregroundNotificationTimerRef.current) {
        clearTimeout(foregroundNotificationTimerRef.current)
      }
    }
  }, [clearMockFoodOrderTimers])

  const refreshNotificationsMeta = useCallback(async () => {
    const unreadCount = await getUnreadPushNotificationsCount()
    setUnreadNotificationsCount(unreadCount)
    setNotificationsReloadKey(currentKey => currentKey + 1)
  }, [])

  const showForegroundNotification = useCallback((notification: PushInboxNotification) => {
    setForegroundNotification(notification)

    if (foregroundNotificationTimerRef.current) {
      clearTimeout(foregroundNotificationTimerRef.current)
    }

    foregroundNotificationTimerRef.current = setTimeout(() => {
      setForegroundNotification(null)
      foregroundNotificationTimerRef.current = null
    }, 4200)
  }, [])

  const handleSignIn = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true)
    const response = await loginUser({ email, password })
    setLoading(false)

    if (!response.ok) {
      return { ok: false as const, message: response.error.message }
    }

    if (!response.data.success || !response.data.data?.accessToken) {
      const message = response.data.error?.message ?? response.data.message ?? 'Invalid email or password'
      return { ok: false as const, message }
    }

    if (response.data.data.role !== 'CLIENT') {
      return { ok: false as const, message: 'This app is only for users.' }
    }

    const nextSession: AuthSession = { ...response.data.data, role: 'CLIENT', email }

    authEntryProgress.setValue(0)
    setSession(nextSession)
    void saveStoredUserSession(nextSession)
    setMainTab('home')
    setOverlayScreen(null)
    return { ok: true as const }
  }

  const handleSignUp = async (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) => {
    setLoading(true)
    const response = await registerUser(params)
    setLoading(false)

    if (!response.ok) {
      return { ok: false as const, message: response.error.message }
    }

    if (!response.data.success) {
      const message = response.data.error?.message ?? response.data.message ?? 'Registration failed'
      return { ok: false as const, message }
    }

    setAuthScreen('sign-in')
    return { ok: true as const }
  }

  const addCartItem = (itemId: string) => {
    setCartItems(currentItems => ({
      ...currentItems,
      [itemId]: (currentItems[itemId] ?? 0) + 1,
    }))
  }

  const removeCartItem = (itemId: string) => {
    setCartItems(currentItems => {
      const nextQuantity = (currentItems[itemId] ?? 0) - 1

      if (nextQuantity <= 0) {
        const { [itemId]: _removed, ...rest } = currentItems
        return rest
      }

      return {
        ...currentItems,
        [itemId]: nextQuantity,
      }
    })
  }

  const clearCart = () => {
    setCartItems({})
  }

  const upsertMockFoodOrder = useCallback((order: UserOrder) => {
    setMockFoodOrders(currentOrders => {
      const nextOrders = currentOrders.filter(currentOrder => currentOrder.orderId !== order.orderId)
      return [order, ...nextOrders].sort((left, right) => {
        const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime()
        return rightTime - leftTime
      })
    })
  }, [])

  const updateMockFoodOrderStatus = useCallback((orderId: string, status: string) => {
    setMockFoodOrders(currentOrders =>
      currentOrders.map(order =>
        order.orderId === orderId
          ? {
              ...order,
              status,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    )
  }, [])

  const scheduleMockFoodOrderLifecycle = useCallback(
    (orderId: string) => {
      mockFoodOrderTimersRef.current[orderId]?.forEach(timer => clearTimeout(timer))

      mockFoodOrderTimersRef.current[orderId] = [
        setTimeout(() => updateMockFoodOrderStatus(orderId, 'ASSIGNED'), 3500),
        setTimeout(() => updateMockFoodOrderStatus(orderId, 'PICKED_UP'), 6500),
        setTimeout(() => updateMockFoodOrderStatus(orderId, 'DELIVERED'), 9500),
      ]
    },
    [updateMockFoodOrderStatus],
  )

  const handleMockFoodOrderPlaced = useCallback(
    (params: {
      restaurantName: string
      total: number
      items: MockFoodCheckoutItem[]
    }) => {
      const order = createMockFoodOrder(params)
      upsertMockFoodOrder(order)
      scheduleMockFoodOrderLifecycle(order.orderId)
      return order
    },
    [scheduleMockFoodOrderLifecycle, upsertMockFoodOrder],
  )

  const openRestaurantMenu = () => {
    setRestaurantInitialScreen('menu')
    setOverlayScreen('restaurant')
  }

  const openRestaurantCart = () => {
    setRestaurantInitialScreen('cart')
    setOverlayScreen('restaurant')
  }

  const openParcelCreate = () => {
    setOverlayScreen('parcel')
  }

  const openOrderTracking = (order: UserOrder) => {
    setSelectedOrder(order)
    setOverlayScreen('order-tracking')
  }

  const openNotificationTarget = useCallback(
    (notification: PushInboxNotification) => {
      setForegroundNotification(null)

      if (notification.orderId) {
        const matchingMockFoodOrder = mockFoodOrders.find(order => order.orderId === notification.orderId)
        const nextOrder =
          matchingMockFoodOrder ??
          ({
            orderId: notification.orderId,
            status: 'NEW',
            serviceType: notification.serviceType ?? 'STANDARD',
            createdAt: notification.createdAt,
            updatedAt: notification.createdAt,
          } satisfies UserOrder)

        setMainTab('orders')
        openOrderTracking(nextOrder)
        return
      }

      setOverlayScreen('notifications')
    },
    [mockFoodOrders],
  )

  const handleParcelCreated = () => {
    setOverlayScreen(null)
    setMainTab('orders')
    setOrdersReloadKey(currentKey => currentKey + 1)
  }

  useEffect(() => {
    if (!session?.accessToken) {
      setUnreadNotificationsCount(0)
      setForegroundNotification(null)
      return
    }

    void registerDeviceToken(session.accessToken).catch(error => {
      console.log(
        '[Notifications] Device token registration skipped:',
        error instanceof Error ? error.message : error,
      )
    })
  }, [session?.accessToken])

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    let isActive = true
    let removeListeners = () => {}

    const setupNotifications = async () => {
      await refreshNotificationsMeta()

      if (!isActive) {
        return
      }

      removeListeners = await setupPushNotificationListeners({
        onForegroundMessage: async remoteMessage => {
          const notification = await appendPushInboxNotificationFromRemoteMessage(remoteMessage)

          if (!isActive) {
            return
          }

          await refreshNotificationsMeta()

          if (!isActive) {
            return
          }

          showForegroundNotification(notification)
        },
        onNotificationOpened: async remoteMessage => {
          const notification = await appendPushInboxNotificationFromRemoteMessage(remoteMessage, {
            unread: false,
          })

          if (!isActive) {
            return
          }

          await refreshNotificationsMeta()

          if (!isActive) {
            return
          }

          openNotificationTarget(notification)
        },
        onInitialNotification: async remoteMessage => {
          const notification = await appendPushInboxNotificationFromRemoteMessage(remoteMessage, {
            unread: false,
          })

          if (!isActive) {
            return
          }

          await refreshNotificationsMeta()

          if (!isActive) {
            return
          }

          openNotificationTarget(notification)
        },
      })
    }

    void setupNotifications()

    return () => {
      isActive = false
      removeListeners()
    }
  }, [openNotificationTarget, refreshNotificationsMeta, session?.accessToken, showForegroundNotification])

  const clearSession = () => {
    clearMockFoodOrderTimers()
    void clearStoredUserSession()
    void clearStoredPushNotifications()
    setMockFoodOrders([])
    setUnreadNotificationsCount(0)
    setForegroundNotification(null)
    setSession(null)
    setMainTab('home')
    setOverlayScreen(null)
    setSelectedOrder(null)
    transitionProgress.setValue(0)
    authEntryProgress.setValue(0)
    profileEntryProgress.setValue(0)
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent />
      {isSessionBootstrapping ? (
        <View style={styles.bootstrapScreen}>
          <ActivityIndicator size="small" color="#D1502C" />
        </View>
      ) : session ? (
        <Animated.View
          style={[
            styles.appNavigator,
            {
              opacity: authEntryProgress,
              transform: [
                {
                  translateY: authEntryProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            pointerEvents={overlayScreen ? 'none' : 'auto'}
            style={styles.screenLayer}
          >
            <View
              pointerEvents={mainTab === 'home' ? 'auto' : 'none'}
              style={[styles.screenLayer, mainTab !== 'home' && styles.hiddenLayer]}
            >
              <UserHomeScreen
                onAddressPress={() => setOverlayScreen('address')}
                onNotificationsPress={() => setOverlayScreen('notifications')}
                unreadNotificationsCount={unreadNotificationsCount}
                onOrdersPress={() => setMainTab('orders')}
                onCartPress={() => setMainTab('cart')}
                onProfilePress={() => setMainTab('profile')}
                onRestaurantPress={openRestaurantMenu}
                onSearchPress={() => setOverlayScreen('search')}
                onParcelsPress={openParcelCreate}
                onSignOut={clearSession}
              />
            </View>

            <View
              pointerEvents={mainTab === 'orders' ? 'auto' : 'none'}
              style={[styles.screenLayer, mainTab !== 'orders' && styles.hiddenLayer]}
            >
              <UserOrdersScreen
                accessToken={session.accessToken}
                supplementalOrders={mockFoodOrders}
                reloadKey={ordersReloadKey}
                onUnauthorized={clearSession}
                onOrderPress={openOrderTracking}
                onHomePress={() => setMainTab('home')}
                onCartPress={() => setMainTab('cart')}
                onProfilePress={() => setMainTab('profile')}
              />
            </View>

            <View
              pointerEvents={mainTab === 'cart' ? 'auto' : 'none'}
              style={[styles.screenLayer, mainTab !== 'cart' && styles.hiddenLayer]}
            >
              <UserCartScreen
                items={[
                  {
                    id: 'margherita',
                    name: 'Truffle Margherita',
                    description: 'Gluten-free crust, extra basil',
                    price: 24,
                    image:
                      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=360&q=80',
                    quantity: cartItems.margherita ?? 0,
                  },
                  {
                    id: 'truffle',
                    name: 'Parmesan Fries',
                    description: 'Truffle aioli dip',
                    price: 8.5,
                    image:
                      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=360&q=80',
                    quantity: cartItems.truffle ?? 0,
                  },
                ].filter(item => item.quantity > 0)}
                onHomePress={() => setMainTab('home')}
                onGoToCatalog={() => setMainTab('home')}
                onGoToPayment={openRestaurantCart}
                onDecreaseItem={removeCartItem}
                onIncreaseItem={addCartItem}
              />
            </View>

            {mainTab === 'profile' && (
              <Animated.View
                style={[
                  styles.screenLayer,
                  {
                    opacity: profileEntryProgress,
                    transform: [
                      {
                        translateX: profileEntryProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [width, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <UserProfileScreen
                  email={session.email}
                  onHomePress={() => setMainTab('home')}
                  onOrdersPress={() => setMainTab('orders')}
                  onSignOut={clearSession}
                />
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View
            pointerEvents={overlayScreen ? 'auto' : 'none'}
            style={[
              styles.screenLayer,
              {
                transform: [
                  {
                    translateX: transitionProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [width, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {overlayScreen === 'search' ? (
              <UserSearchScreen onCancelPress={() => setOverlayScreen(null)} />
            ) : overlayScreen === 'address' ? (
              <UserAddressScreen
                onBackPress={() => setOverlayScreen(null)}
                onConfirmPress={() => setOverlayScreen(null)}
              />
            ) : overlayScreen === 'restaurant' ? (
              <RestaurantDetailScreen
                initialScreen={restaurantInitialScreen}
                cartItems={cartItems}
                onAddItem={addCartItem}
                onRemoveItem={removeCartItem}
                onClearCart={clearCart}
                onMockFoodOrderPlaced={handleMockFoodOrderPlaced}
                onBackPress={() => setOverlayScreen(null)}
              />
            ) : overlayScreen === 'parcel' ? (
              <UserParcelFlowScreen
                accessToken={session.accessToken}
                onBackPress={() => setOverlayScreen(null)}
                onOrdersPress={() => {
                  setOverlayScreen(null)
                  setMainTab('orders')
                }}
                onCreated={handleParcelCreated}
              />
            ) : overlayScreen === 'order-tracking' && selectedOrder ? (
              <UserOrderTrackingScreen
                accessToken={session.accessToken}
                initialOrder={selectedOrder}
                onBackPress={() => setOverlayScreen(null)}
                onUnauthorized={clearSession}
              />
            ) : (
              <UserNotificationsScreen
                reloadKey={notificationsReloadKey}
                onBackPress={() => setOverlayScreen(null)}
                onNotificationPress={notification => {
                  void refreshNotificationsMeta()
                  openNotificationTarget(notification)
                }}
                onNotificationsChanged={() => {
                  void refreshNotificationsMeta()
                }}
              />
            )}
          </Animated.View>

          {foregroundNotification ? (
            <SafeAreaView pointerEvents="box-none" edges={['top']} style={styles.bannerSafeArea}>
              <Pressable
                onPress={() => {
                  void markPushNotificationRead(foregroundNotification.id).finally(() => {
                    void refreshNotificationsMeta()
                  })
                  openNotificationTarget(foregroundNotification)
                }}
                style={({ pressed }) => [
                  styles.bannerCard,
                  pressed && styles.bannerCardPressed,
                ]}
              >
                <View style={styles.bannerIcon}>
                  <Text allowFontScaling={false} style={styles.bannerIconText}>
                    {foregroundNotification.category === 'Orders' ? 'O' : foregroundNotification.category[0]}
                  </Text>
                </View>

                <View style={styles.bannerBody}>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.bannerTitle}>
                    {foregroundNotification.title}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={2} style={styles.bannerMessage}>
                    {foregroundNotification.message}
                  </Text>
                </View>
              </Pressable>
            </SafeAreaView>
          ) : null}
        </Animated.View>
      ) : authScreen === 'sign-in' ? (
        <UserSignInScreen
          loading={loading}
          onSignIn={handleSignIn}
          onSignUpPress={() => setAuthScreen('sign-up')}
        />
      ) : (
        <UserSignUpScreen
          loading={loading}
          onBackPress={() => setAuthScreen('sign-in')}
          onSignUp={handleSignUp}
        />
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  appNavigator: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f7f9fb',
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hiddenLayer: {
    opacity: 0,
  },
  bootstrapScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f9fb',
  },
  bannerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(25, 28, 30, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  bannerCardPressed: {
    opacity: 0.92,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1502C',
  },
  bannerIconText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerBody: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.76)',
  },
})
