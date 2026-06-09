import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { MockFoodCheckoutItem } from '../../data/mockFoodOrders'
import type { UserOrder } from '../../data/ordersApi'
import { RestaurantCartScreen } from './RestaurantCartScreen'
import { OrderAcceptingScreen } from './OrderAcceptingScreen'
import { OrderStatusScreen } from './OrderStatusScreen'

type RestaurantDetailScreenProps = {
  initialScreen?: 'menu' | 'cart'
  accessToken?: string
  cartItems: Record<string, number>
  onAddItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  onFoodOrderPlaced?: (params: {
    restaurantName: string
    total: number
    items: MockFoodCheckoutItem[]
    serviceType: 'STANDARD' | 'SCHEDULED' | 'EXPRESS'
    scheduleTime?: string
    pickupAddress?: string
    pickupLat?: number
    pickupLon?: number
  }) => Promise<UserOrder>
  onBackPress?: () => void
  deliveryAddress?: string
  onAddressEditPress?: () => void
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

const mockReviews = [
  {
    id: 'r1',
    userName: 'Alexandra M.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    date: 'Yesterday',
    text: 'The Margherita Bliss was absolute perfection! Crust was incredibly thin and crispy, and the fresh basil added such a lovely fragrance. Packing was neat and arrived boiling hot!',
    helpfulCount: 14,
    restaurantReply: 'Thank you so much for your kind words, Alexandra! We are thrilled to hear you loved the pizza. Looking forward to your next order!',
  },
  {
    id: 'r2',
    userName: 'Dmitry K.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    date: '3 days ago',
    text: 'Truffle Mushroom pizza is a masterpiece. The roasted garlic cream base combined with wild mushrooms is simply out of this world. Delivery was fast too!',
    helpfulCount: 8,
  },
  {
    id: 'r3',
    userName: 'Sophia L.',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
    rating: 4,
    date: '1 week ago',
    text: 'Extremely delicious, though I wish there was a bit more truffle oil on the Truffle Mushroom pizza. Nonetheless, highly recommend and will order again.',
    helpfulCount: 3,
  },
  {
    id: 'r4',
    userName: 'Artem S.',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    date: '1 week ago',
    text: 'Best Italian pizza in town! The ingredients are extremely fresh and the crust is so flavorful. Highly recommend ordering with extra cheese.',
    helpfulCount: 5,
  },
  {
    id: 'r5',
    userName: 'Elena V.',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    rating: 3,
    date: '2 weeks ago',
    text: 'Food is great, but delivery was delayed by 15 minutes. Pizza was a bit cold, had to reheat it. Will give them another chance because the flavor is excellent.',
    helpfulCount: 2,
  },
]

const ratingDistribution = [
  { rating: 5, count: 412, percentage: 78 },
  { rating: 4, count: 79, percentage: 15 },
  { rating: 3, count: 21, percentage: 4 },
  { rating: 2, count: 12, percentage: 2 },
  { rating: 1, count: 8, percentage: 1 },
]

export function RestaurantDetailScreen({
  initialScreen = 'menu',
  accessToken,
  cartItems,
  onAddItem,
  onRemoveItem,
  onClearCart,
  onFoodOrderPlaced,
  onBackPress,
  deliveryAddress,
  onAddressEditPress,
}: RestaurantDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'cart' | 'accepting' | 'status'>(
    initialScreen,
  )
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Popular')
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'info'>('menu')
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<'All' | '5 ★' | '4 ★' | '3 ★' | 'Recent'>('All')
  const [helpfulState, setHelpfulState] = useState<Record<string, boolean>>({})

  const toggleHelpful = (reviewId: string) => {
    setHelpfulState(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const filteredReviews = useMemo(() => {
    let list = mockReviews
    if (selectedReviewFilter === '5 ★') {
      list = list.filter(r => r.rating === 5)
    } else if (selectedReviewFilter === '4 ★') {
      list = list.filter(r => r.rating === 4)
    } else if (selectedReviewFilter === '3 ★') {
      list = list.filter(r => r.rating === 3)
    }
    return list
  }, [selectedReviewFilter])

  const filteredMenuItems = useMemo(() => {
    let items = menuItems

    if (selectedCategory !== 'Popular') {
      const cat = selectedCategory.toLowerCase()
      if (cat === 'pizza') {
        items = items.filter(item => item.id === 'margherita')
      } else if (cat === 'drinks' || cat === 'desserts') {
        items = []
      }
    }

    if (menuSearchQuery.trim()) {
      const query = menuSearchQuery.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    }

    return items
  }, [selectedCategory, menuSearchQuery])
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

  const handleCheckout = async (serviceType: 'STANDARD' | 'SCHEDULED' | 'EXPRESS', scheduleTime?: string) => {
    const activeDeliveryFee = cartSummary.count > 0
      ? serviceType === 'EXPRESS'
        ? 3.5
        : serviceType === 'SCHEDULED'
        ? 1.5
        : 2
      : 0
    const activeTotal = Math.max(0, cartSummary.total + activeDeliveryFee - discount)
    try {
      const order = await onFoodOrderPlaced?.({
        restaurantName: 'The Artisan Crust',
        total: activeTotal,
        items: selectedCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        serviceType,
        scheduleTime,
        pickupAddress: 'Mangilik El Ave, 53',
        pickupLat: 51.1282,
        pickupLon: 71.4304,
      })
      if (order) {
        setPlacedOrder({
          orderId: order.orderId,
          restaurantName: 'The Artisan Crust',
          total: activeTotal,
          orderNumber: order.orderId.slice(-6).toUpperCase(),
          items: selectedCartItems,
        })
        setCurrentScreen('accepting')
      }
    } catch (error) {
      Alert.alert('Checkout Error', error instanceof Error ? error.message : 'Unknown checkout error')
    }
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
        accessToken={accessToken}
        orderId={placedOrder?.orderId}
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
        deliveryAddress={deliveryAddress}
        onAddressEditPress={onAddressEditPress}
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
            <Pressable
              onPress={() => setActiveTab('menu')}
              style={activeTab === 'menu' ? styles.tabActive : styles.tab}
            >
              <Text allowFontScaling={false} style={activeTab === 'menu' ? styles.tabActiveText : styles.tabText}>
                Menu
              </Text>
              {activeTab === 'menu' && <View style={styles.tabIndicator} />}
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('reviews')}
              style={activeTab === 'reviews' ? styles.tabActive : styles.tab}
            >
              <Text allowFontScaling={false} style={activeTab === 'reviews' ? styles.tabActiveText : styles.tabText}>
                Reviews
              </Text>
              {activeTab === 'reviews' && <View style={styles.tabIndicator} />}
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('info')}
              style={activeTab === 'info' ? styles.tabActive : styles.tab}
            >
              <Text allowFontScaling={false} style={activeTab === 'info' ? styles.tabActiveText : styles.tabText}>
                Info
              </Text>
              {activeTab === 'info' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>

          {/* Menu Tab Content */}
          {activeTab === 'menu' && (
            <>
              {/* Premium inline Search Bar по центру */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={18} color="#8b716b" style={styles.searchIcon} />
                  <TextInput
                    allowFontScaling={false}
                    value={menuSearchQuery}
                    onChangeText={setMenuSearchQuery}
                    placeholder="Search in menu"
                    placeholderTextColor="rgba(88, 66, 60, 0.6)"
                    style={styles.searchInput}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                {categories.map((category) => {
                  const isActive = selectedCategory === category
                  return (
                    <Pressable
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[styles.categoryText, isActive && styles.categoryTextActive]}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>

              <View style={styles.menuList}>
                {filteredMenuItems.map(item => {
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
                      <Image source={{ uri: item.image }} resizeMode="cover" style={styles.menuImage as any} />
                    </View>
                  )
                })}
              </View>
            </>
          )}

          {/* Reviews Tab Content */}
          {activeTab === 'reviews' && (
            <View style={styles.tabContentContainer}>
              {/* Overall rating card */}
              <View style={styles.reviewsSummaryCard}>
                <View style={styles.summaryLeft}>
                  <Text allowFontScaling={false} style={styles.summaryRatingScore}>
                    4.8
                  </Text>
                  <View style={styles.starsRow}>
                    <Ionicons name="star" size={14} color="#ff7a59" />
                    <Ionicons name="star" size={14} color="#ff7a59" />
                    <Ionicons name="star" size={14} color="#ff7a59" />
                    <Ionicons name="star" size={14} color="#ff7a59" />
                    <Ionicons name="star-half" size={14} color="#ff7a59" />
                  </View>
                  <Text allowFontScaling={false} style={styles.summaryCountText}>
                    Based on{'\n'}532 reviews
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRight}>
                  {ratingDistribution.map((item) => (
                    <View key={item.rating} style={styles.distributionRow}>
                      <Text allowFontScaling={false} style={styles.distributionStarLabel}>
                        {item.rating}★
                      </Text>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${item.percentage}%` }]} />
                      </View>
                      <Text allowFontScaling={false} style={styles.distributionPercentage}>
                        {item.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Filter chips for Reviews */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewsFilterRow}
              >
                {(['All', '5 ★', '4 ★', '3 ★', 'Recent'] as const).map((filter) => {
                  const isActive = selectedReviewFilter === filter
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setSelectedReviewFilter(filter)}
                      style={[styles.reviewFilterChip, isActive && styles.reviewFilterChipActive]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[styles.reviewFilterText, isActive && styles.reviewFilterTextActive]}
                      >
                        {filter}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>

              {/* Reviews List */}
              <View style={styles.reviewsList}>
                {filteredReviews.length === 0 ? (
                  <View style={styles.emptyReviewsContainer}>
                    <Feather name="message-square" size={32} color="#eceef0" />
                    <Text allowFontScaling={false} style={styles.emptyReviewsText}>
                      No reviews matching this rating filter.
                    </Text>
                  </View>
                ) : (
                  filteredReviews.map((review) => {
                    const isHelpful = helpfulState[review.id] ?? false
                    return (
                      <View key={review.id} style={styles.reviewCard}>
                        {/* Header row: Avatar, Name, Stars, Date */}
                        <View style={styles.reviewHeaderRow}>
                          <Image source={{ uri: review.userAvatar }} style={styles.reviewerAvatar as any} />
                          <View style={styles.reviewerInfo}>
                            <Text allowFontScaling={false} style={styles.reviewerName}>
                              {review.userName}
                            </Text>
                            <View style={styles.reviewMetaRow}>
                              <View style={styles.reviewStars}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Ionicons
                                    key={index}
                                    name={index < review.rating ? 'star' : 'star-outline'}
                                    size={12}
                                    color="#ff7a59"
                                    style={{ marginRight: 2 }}
                                  />
                                ))}
                              </View>
                              <View style={styles.reviewDot} />
                              <Text allowFontScaling={false} style={styles.reviewDate}>
                                {review.date}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Review Text */}
                        <Text allowFontScaling={false} style={styles.reviewTextBody}>
                          {review.text}
                        </Text>

                        {/* Restaurant Reply if exists */}
                        {review.restaurantReply && (
                          <View style={styles.replyBubble}>
                            <View style={styles.replyHeader}>
                              <View style={styles.replyAvatarBox}>
                                <MaterialCommunityIcons name="storefront-outline" size={14} color="#701500" />
                              </View>
                              <Text allowFontScaling={false} style={styles.replyTitle}>
                                Response from The Artisan Crust
                              </Text>
                            </View>
                            <Text allowFontScaling={false} style={styles.replyTextBody}>
                              {review.restaurantReply}
                            </Text>
                          </View>
                        )}

                        {/* Review Footer Actions */}
                        <View style={styles.reviewFooter}>
                          <Pressable
                            onPress={() => toggleHelpful(review.id)}
                            style={[styles.helpfulButton, isHelpful && styles.helpfulButtonActive]}
                          >
                            <Feather
                              name="thumbs-up"
                              size={13}
                              color={isHelpful ? '#701500' : '#8b716b'}
                            />
                            <Text
                              allowFontScaling={false}
                              style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}
                            >
                              Helpful ({review.helpfulCount + (isHelpful ? 1 : 0)})
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => Alert.alert('Reply', 'Replies are currently disabled.')}
                            style={styles.replyButton}
                          >
                            <Feather name="corner-up-left" size={13} color="#8b716b" />
                            <Text allowFontScaling={false} style={styles.replyButtonText}>
                              Reply
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )
                  })
                )}
              </View>
            </View>
          )}

          {/* Info Tab Content */}
          {activeTab === 'info' && (
            <View style={styles.tabContentContainer}>
              {/* Story Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconBg, { backgroundColor: '#fde5df' }]}>
                    <MaterialCommunityIcons name="chef-hat" size={20} color="#a7391e" />
                  </View>
                  <Text allowFontScaling={false} style={styles.infoSectionTitle}>
                    Our Story
                  </Text>
                </View>
                <Text allowFontScaling={false} style={styles.infoStoryText}>
                  Welcome to The Artisan Crust, where we bring the authentic flavors of traditional Neapolitan pizza straight to your door. Our dough is naturally leavened for 48 hours, resulting in a light, airy, and beautifully charred crust. We source our San Marzano tomatoes, fresh mozzarella di bufala, and extra virgin olive oil directly from Italy. Every pizza is crafted with passion and baked to perfection in our custom wood-fired oven.
                </Text>
              </View>

              {/* Hours Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconBg, { backgroundColor: '#e2f0e2' }]}>
                    <Feather name="clock" size={18} color="#446744" />
                  </View>
                  <View style={styles.infoHoursTitleRow}>
                    <Text allowFontScaling={false} style={styles.infoSectionTitle}>
                      Opening Hours
                    </Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text allowFontScaling={false} style={styles.statusText}>
                        Open Now
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.hoursList}>
                  <View style={styles.hoursRow}>
                    <Text allowFontScaling={false} style={styles.hoursDayText}>
                      Monday - Friday
                    </Text>
                    <Text allowFontScaling={false} style={styles.hoursTimeText}>
                      09:00 - 22:00
                    </Text>
                  </View>
                  <View style={styles.hoursDivider} />
                  <View style={styles.hoursRow}>
                    <Text allowFontScaling={false} style={styles.hoursDayText}>
                      Saturday - Sunday
                    </Text>
                    <Text allowFontScaling={false} style={styles.hoursTimeText}>
                      10:00 - 23:00
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location & Map Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconBg, { backgroundColor: '#e3f2fd' }]}>
                    <Feather name="map-pin" size={18} color="#1e88e5" />
                  </View>
                  <Text allowFontScaling={false} style={styles.infoSectionTitle}>
                    Location & Contact
                  </Text>
                </View>

                <View style={styles.contactDetails}>
                  <View style={styles.contactItem}>
                    <Feather name="navigation" size={14} color="#58423c" style={{ marginRight: 8 }} />
                    <Text allowFontScaling={false} style={styles.contactText}>
                      124 Gourmet Boulevard, Suite A, Food District
                    </Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Feather name="phone" size={14} color="#58423c" style={{ marginRight: 8 }} />
                    <Text allowFontScaling={false} style={styles.contactText}>
                      +1 (555) 019-2834
                    </Text>
                  </View>
                </View>

                {/* Styled Mock Map */}
                <View style={styles.mockMapContainer}>
                  <ImageBackground
                    source={{
                      uri: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80',
                    }}
                    style={styles.mockMap}
                  >
                    <View style={styles.mockMapOverlay}>
                      <View style={styles.mapPinPulseContainer}>
                        <View style={styles.mapPinPulse} />
                        <View style={styles.mapPin}>
                          <Ionicons name="location" size={24} color="#a7391e" />
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                </View>

                <Pressable
                  onPress={() => Alert.alert('Maps', 'Opening coordinates in system maps...')}
                  style={styles.viewMapsButton}
                >
                  <Feather name="external-link" size={14} color="#a7391e" />
                  <Text allowFontScaling={false} style={styles.viewMapsButtonText}>
                    Get Directions
                  </Text>
                </Pressable>
              </View>

              {/* Standards / Features Grid */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconBg, { backgroundColor: '#f3e5f5' }]}>
                    <Feather name="shield" size={18} color="#8e24aa" />
                  </View>
                  <Text allowFontScaling={false} style={styles.infoSectionTitle}>
                    Our Standards
                  </Text>
                </View>

                <View style={styles.standardsGrid}>
                  <View style={styles.standardItem}>
                    <View style={styles.standardIconContainer}>
                      <MaterialCommunityIcons name="leaf" size={20} color="#446744" />
                    </View>
                    <Text allowFontScaling={false} style={styles.standardTitle}>
                      Eco-Packaging
                    </Text>
                    <Text allowFontScaling={false} style={styles.standardDesc}>
                      100% biodegradable
                    </Text>
                  </View>

                  <View style={styles.standardItem}>
                    <View style={styles.standardIconContainer}>
                      <MaterialCommunityIcons name="shield-check" size={20} color="#2e7d32" />
                    </View>
                    <Text allowFontScaling={false} style={styles.standardTitle}>
                      Hygiene Certified
                    </Text>
                    <Text allowFontScaling={false} style={styles.standardDesc}>
                      A+ sanitation grade
                    </Text>
                  </View>

                  <View style={styles.standardItem}>
                    <View style={styles.standardIconContainer}>
                      <MaterialCommunityIcons name="truck-fast" size={20} color="#a7391e" />
                    </View>
                    <Text allowFontScaling={false} style={styles.standardTitle}>
                      Contactless
                    </Text>
                    <Text allowFontScaling={false} style={styles.standardDesc}>
                      Safe drop-off delivery
                    </Text>
                  </View>

                  <View style={styles.standardItem}>
                    <View style={styles.standardIconContainer}>
                      <MaterialCommunityIcons name="food-apple" size={20} color="#ff7a59" />
                    </View>
                    <Text allowFontScaling={false} style={styles.standardTitle}>
                      Fresh Ingredients
                    </Text>
                    <Text allowFontScaling={false} style={styles.standardDesc}>
                      Sourced daily
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBackPress} style={styles.navCircle}>
          <Feather name="arrow-left" size={18} color="#191c1e" />
        </Pressable>

        <View style={styles.topActions}>
          <Pressable
            onPress={() => Alert.alert('Share', 'Link copied to clipboard!')}
            style={styles.navCircle}
          >
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
    color: '#8a8d90',
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
  searchContainer: {
    paddingHorizontal: 4,
    marginVertical: 6,
  },
  searchBox: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIcon: {
    marginTop: 1,
  },
  searchInput: {
    flex: 1,
    color: '#191C1E',
    paddingVertical: 6,
    fontWeight: '500',
  },
  tabContentContainer: {
    gap: 16,
    marginTop: 4,
  },
  reviewsSummaryCard: {
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  summaryLeft: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 6,
  },
  summaryRatingScore: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#191c1e',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 2,
  },
  summaryCountText: {
    fontSize: 10,
    lineHeight: 13,
    color: '#8b716b',
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#eceef0',
    marginHorizontal: 4,
  },
  summaryRight: {
    flex: 1.9,
    gap: 5,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distributionStarLabel: {
    width: 22,
    fontSize: 10,
    lineHeight: 14,
    color: '#58423c',
    fontWeight: '700',
    textAlign: 'right',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#eceef0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ff7a59',
  },
  distributionPercentage: {
    width: 26,
    fontSize: 10,
    lineHeight: 14,
    color: '#8b716b',
    fontWeight: '600',
    textAlign: 'right',
  },
  reviewsFilterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  reviewFilterChip: {
    height: 32,
    paddingHorizontal: 16,
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
  reviewFilterChipActive: {
    backgroundColor: '#ff7a59',
  },
  reviewFilterText: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  reviewFilterTextActive: {
    color: '#701500',
  },
  reviewsList: {
    gap: 14,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: 12,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eceef0',
  },
  reviewerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: '#191c1e',
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d8dadc',
  },
  reviewDate: {
    fontSize: 11,
    lineHeight: 14,
    color: '#8b716b',
    fontWeight: '600',
  },
  reviewTextBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#191c1e',
    fontWeight: '400',
  },
  replyBubble: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f7f9fb',
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ff7a59',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyAvatarBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#701500',
  },
  replyTextBody: {
    fontSize: 12,
    lineHeight: 17,
    color: '#58423c',
    fontWeight: '400',
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f7f9fb',
    paddingTop: 10,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  helpfulButtonActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.12)',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  helpfulText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#8b716b',
    fontWeight: '700',
  },
  helpfulTextActive: {
    color: '#701500',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#8b716b',
    fontWeight: '700',
  },
  emptyReviewsContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyReviewsText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8b716b',
    textAlign: 'center',
  },
  infoCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: 14,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#191c1e',
  },
  infoHoursTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoStoryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#58423c',
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(68, 103, 68, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#446744',
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#446744',
    fontWeight: '800',
  },
  hoursList: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursDayText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#58423c',
    fontWeight: '500',
  },
  hoursTimeText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#191c1e',
    fontWeight: '700',
  },
  hoursDivider: {
    height: 1,
    backgroundColor: '#f7f9fb',
  },
  contactDetails: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#58423c',
    fontWeight: '500',
    flex: 1,
  },
  mockMapContainer: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#eceef0',
    marginTop: 4,
  },
  mockMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 28, 30, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinPulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(167, 57, 30, 0.25)',
  },
  mapPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 57, 30, 0.15)',
    borderStyle: 'solid',
  },
  viewMapsButtonText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#a7391e',
    fontWeight: '700',
  },
  standardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  standardItem: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f7f9fb',
    gap: 4,
  },
  standardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  standardTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: '#191c1e',
    marginTop: 4,
  },
  standardDesc: {
    fontSize: 10,
    lineHeight: 14,
    color: '#8b716b',
    fontWeight: '500',
  },
})
