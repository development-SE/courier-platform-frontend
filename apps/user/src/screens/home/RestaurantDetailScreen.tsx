import { useEffect, useMemo, useState } from 'react'
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createMockFoodOrder, type MockFoodCheckoutItem } from '../../data/mockFoodOrders'
import type { UserOrder } from '../../data/ordersApi'
import { RestaurantCartScreen } from './RestaurantCartScreen'
import { OrderAcceptingScreen } from './OrderAcceptingScreen'
import { OrderStatusScreen } from './OrderStatusScreen'

type RestaurantDetailScreenProps = {
  initialScreen?: 'menu' | 'cart'
  cartItems: Record<string, number>
  onAddItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  onMockFoodOrderPlaced?: (params: {
    restaurantName: string
    total: number
    items: MockFoodCheckoutItem[]
  }) => UserOrder
  onBackPress?: () => void
}

type MenuItem = {
  id: string
  name: string
  description: string
  cartDescription: string
  price: number
  image: string
}

type PlacedOrderItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

const categories = ['Popular', 'Pizza', 'Drinks', 'Desserts']

const menuItems: MenuItem[] = [
  {
    id: 'margherita',
    name: 'Margherita Bliss',
    description: 'San Marzano tomato sauce, fresh mozzarella, basil...',
    cartDescription: 'Fresh basil, mozzarella, and san marzano tomatoes.',
    price: 14,
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=360&q=80',
  },
  {
    id: 'truffle',
    name: 'Truffle Mushroom',
    description: 'Wild mushrooms, truffle oil, roasted garlic cream...',
    cartDescription: 'Wild mushrooms, truffle oil, and roasted garlic cream.',
    price: 18.5,
    image:
      'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=360&q=80',
  },
]

export function RestaurantDetailScreen({
  initialScreen = 'menu',
  cartItems,
  onAddItem,
  onRemoveItem,
  onClearCart,
  onMockFoodOrderPlaced,
  onBackPress,
}: RestaurantDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'cart' | 'accepting' | 'status'>(
    initialScreen,
  )
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string
    restaurantName: string
    total: number
    orderNumber: string
    items: PlacedOrderItem[]
  } | null>(null)

  const cartSummary = useMemo(() => {
    return menuItems.reduce(
      (summary, item) => {
        const quantity = cartItems[item.id] ?? 0

        return {
          count: summary.count + quantity,
          total: summary.total + item.price * quantity,
        }
      },
      { count: 0, total: 0 },
    )
  }, [cartItems])

  const deliveryFee = cartSummary.count > 0 ? 2 : 0
  const discount = cartSummary.count > 0 ? 4 : 0
  const checkoutTotal = Math.max(0, cartSummary.total + deliveryFee - discount)

  const selectedCartItems = useMemo(
    () =>
      menuItems
        .filter(item => (cartItems[item.id] ?? 0) > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.cartDescription,
          price: item.price,
          image: item.image,
          quantity: cartItems[item.id] ?? 0,
        })),
    [cartItems],
  )

  useEffect(() => {
    if (currentScreen === 'cart' && cartSummary.count === 0) {
      setCurrentScreen('menu')
    }
  }, [cartSummary.count, currentScreen])

  const handleCheckout = () => {
    const fallbackOrder = createMockFoodOrder({
      restaurantName: 'The Artisan Crust',
      total: checkoutTotal,
      items: selectedCartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })

    const order =
      onMockFoodOrderPlaced?.({
        restaurantName: 'The Artisan Crust',
        total: checkoutTotal,
        items: selectedCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }) ?? fallbackOrder

    setPlacedOrder({
      orderId: order.orderId,
      restaurantName: 'The Artisan Crust',
      total: checkoutTotal,
      orderNumber: order.orderId.slice(-6).toUpperCase(),
      items: selectedCartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      })),
    })
    setCurrentScreen('accepting')
  }

  const handleAcceptingComplete = () => {
    onClearCart()
    setCurrentScreen('status')
  }

  if (currentScreen === 'accepting') {
    return (
      <OrderAcceptingScreen
        restaurantName={placedOrder?.restaurantName ?? 'The Artisan Crust'}
        total={placedOrder?.total ?? checkoutTotal}
        orderNumber={placedOrder?.orderNumber ?? '4412'}
        onComplete={handleAcceptingComplete}
      />
    )
  }

  if (currentScreen === 'status') {
    return (
      <OrderStatusScreen
        restaurantName={placedOrder?.restaurantName ?? 'The Artisan Crust'}
        orderNumber={placedOrder?.orderNumber ?? '4412'}
        total={placedOrder?.total ?? checkoutTotal}
        orderedItems={placedOrder?.items ?? []}
        onBackPress={() => setCurrentScreen('menu')}
      />
    )
  }

  if (currentScreen === 'cart') {
    return (
      <RestaurantCartScreen
        items={selectedCartItems}
        subtotal={cartSummary.total}
        total={checkoutTotal}
        onBackPress={() => {
          if (initialScreen === 'cart') {
            onBackPress?.()
            return
          }

          setCurrentScreen('menu')
        }}
        onAddMoreItems={() => setCurrentScreen('menu')}
        onClearCart={onClearCart}
        onDecreaseItem={onRemoveItem}
        onIncreaseItem={onAddItem}
        onCheckout={handleCheckout}
      />
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: cartSummary.count > 0 ? 132 + insets.bottom : 32 + insets.bottom },
        ]}
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
          }}
          resizeMode="cover"
          style={styles.hero}
        >
          <View style={styles.heroShade} />
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.restaurantCard}>
            <Text allowFontScaling={false} style={styles.restaurantTitle}>
              The Artisan Crust
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={12} color="#a7391e" />
                <Text allowFontScaling={false} style={styles.metaPrimary}>
                  4.8{'\n'}(500+)
                </Text>
              </View>
              <View style={styles.metaDot} />
              <Text allowFontScaling={false} style={styles.metaText}>
                20-30{'\n'}min
              </Text>
              <View style={styles.metaDot} />
              <Text allowFontScaling={false} style={styles.metaText}>
                $$
              </Text>
              <View style={styles.metaDot} />
              <Text allowFontScaling={false} style={styles.metaText}>
                Italian,{'\n'}Pizza
              </Text>
            </View>

            <View style={styles.badgesRow}>
              <View style={styles.deliveryBadge}>
                <MaterialCommunityIcons name="truck-delivery" size={12} color="#701500" />
                <Text allowFontScaling={false} style={styles.deliveryBadgeText}>
                  FREE DELIVERY
                </Text>
              </View>
              <View style={styles.topBadge}>
                <Text allowFontScaling={false} style={styles.topBadgeText}>
                  TOP RATED
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tabsRow}>
            <Pressable style={styles.tabActive}>
              <Text allowFontScaling={false} style={styles.tabActiveText}>
                Menu
              </Text>
              <View style={styles.tabIndicator} />
            </Pressable>
            <Pressable style={styles.tab}>
              <Text allowFontScaling={false} style={styles.tabText}>
                Reviews
              </Text>
            </Pressable>
            <Pressable style={styles.tab}>
              <Text allowFontScaling={false} style={styles.tabText}>
                Info
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((category, index) => (
              <Pressable
                key={category}
                style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.categoryText, index === 0 && styles.categoryTextActive]}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.menuList}>
            {menuItems.map(item => {
              const quantity = cartItems[item.id] ?? 0

              return (
                <View key={item.id} style={styles.menuCard}>
                  <View style={styles.menuCopy}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.menuTitle}>
                      {item.name}
                    </Text>
                    <Text allowFontScaling={false} numberOfLines={2} style={styles.menuDescription}>
                      {item.description}
                    </Text>
                    <View style={styles.menuBottomRow}>
                      <Text allowFontScaling={false} style={styles.menuPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                      {quantity > 0 ? (
                        <View style={styles.quantityControls}>
                          <Pressable
                            hitSlop={8}
                            onPress={() => onRemoveItem(item.id)}
                            style={[styles.quantityAction, styles.quantityActionSecondary]}
                          >
                            <Text allowFontScaling={false} style={styles.quantityActionSecondaryText}>
                              -
                            </Text>
                          </Pressable>

                          <Text allowFontScaling={false} style={styles.quantityValue}>
                            {quantity}
                          </Text>

                          <Pressable
                            hitSlop={8}
                            onPress={() => onAddItem(item.id)}
                            style={[styles.quantityAction, styles.quantityActionPrimary]}
                          >
                            <Text allowFontScaling={false} style={styles.quantityActionPrimaryText}>
                              +
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          hitSlop={8}
                          onPress={() => onAddItem(item.id)}
                          style={styles.addMenuButton}
                        >
                          <Feather name="plus" size={16} color="#191c1e" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Image source={{ uri: item.image }} resizeMode="cover" style={styles.menuImage} />
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBackPress} style={styles.navCircle}>
          <Feather name="arrow-left" size={18} color="#191c1e" />
        </Pressable>

        <View style={styles.topActions}>
          <Pressable style={styles.navCircle}>
            <FontAwesome5 name="heart" solid size={16} color="#a7391e" />
          </Pressable>
          <Pressable style={styles.navCircle}>
            <Feather name="share-2" size={17} color="#191c1e" />
          </Pressable>
        </View>
      </View>

      {cartSummary.count > 0 ? (
        <View style={[styles.cartWrap, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <View style={styles.cartBar}>
            <View style={styles.cartLeft}>
              <View style={styles.cartCountCircle}>
                <Text allowFontScaling={false} style={styles.cartCountText}>
                  {cartSummary.count}
                </Text>
              </View>
              <View>
                <Text allowFontScaling={false} style={styles.cartLabel}>
                  Total
                </Text>
                <Text allowFontScaling={false} style={styles.cartTotal}>
                  ${cartSummary.total.toFixed(2)}
                </Text>
              </View>
            </View>

            <Pressable onPress={() => setCurrentScreen('cart')} style={styles.viewCartButton}>
              <Text allowFontScaling={false} style={styles.viewCartText}>
                View Cart
              </Text>
              <Feather name="arrow-right" size={16} color="#ff7a59" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  content: {
    backgroundColor: '#f7f9fb',
  },
  hero: {
    height: 228,
    overflow: 'hidden',
    backgroundColor: '#f2f4f6',
  },
  heroShade: {
    flex: 1,
    backgroundColor: 'rgba(247, 249, 251, 0.04)',
  },
  body: {
    paddingHorizontal: 16,
    marginTop: -92,
    gap: 22,
  },
  restaurantCard: {
    padding: 20,
    borderRadius: 24,
    gap: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  restaurantTitle: {
    color: '#191c1e',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPrimary: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
  metaText: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8dadc',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  deliveryBadge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 122, 89, 0.20)',
  },
  deliveryBadgeText: {
    color: '#701500',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.25,
    fontWeight: '800',
  },
  topBadge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  topBadgeText: {
    color: '#191c1e',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.25,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    paddingHorizontal: 4,
  },
  tabActive: {
    height: 36,
    justifyContent: 'space-between',
  },
  tab: {
    height: 36,
    justifyContent: 'flex-start',
  },
  tabActiveText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  tabText: {
    color: '#d8dadc',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  tabIndicator: {
    width: 32,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#ff7a59',
  },
  categoriesRow: {
    gap: 12,
    paddingRight: 16,
  },
  categoryChip: {
    height: 36,
    minWidth: 74,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: '#ff7a59',
  },
  categoryText: {
    color: '#191c1e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#701500',
  },
  menuList: {
    gap: 14,
    paddingTop: 2,
  },
  menuCard: {
    minHeight: 132,
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  menuCopy: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  menuTitle: {
    color: '#191c1e',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  menuDescription: {
    color: '#58423c',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    marginTop: 3,
  },
  menuBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  menuPrice: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  addMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityActionSecondary: {
    backgroundColor: '#fde5df',
  },
  quantityActionPrimary: {
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 2,
  },
  quantityActionSecondaryText: {
    color: '#701500',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  quantityActionPrimaryText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  quantityValue: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  menuImage: {
    width: 104,
    height: 104,
    borderRadius: 22,
    backgroundColor: '#e6e8ea',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  cartWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
  },
  cartBar: {
    minHeight: 72,
    padding: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ff7a59',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartCountCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#701500',
  },
  cartCountText: {
    color: '#ff7a59',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  cartLabel: {
    color: 'rgba(112, 21, 0, 0.78)',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  cartTotal: {
    color: '#701500',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  viewCartButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#701500',
  },
  viewCartText: {
    color: '#ff7a59',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.3,
    fontWeight: '800',
  },
})
