import { useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type Restaurant = {
  id: string
  name: string
  type: string
  time: string
  rating: string
  deliveryFee: string
  image: string
}

type PopularDish = {
  id: string
  name: string
  restaurant: string
  price: string
  image: string
}

const categories = [
  'All',
  'Burgers',
  'Pizza',
  'Sushi',
  'Fast Food',
  'Drinks',
  'Desserts',
  'Healthy',
  'Asian',
]

const filterTags = ['Sort', '4.5+', 'Fast delivery', 'Free delivery', 'Price', 'Open now']

const mockRestaurants: Restaurant[] = [
  {
    id: 'rustic-patty',
    name: 'The Rustic Patty',
    type: 'Burgers • American • Fast Food',
    time: '25-35 min',
    rating: '4.8',
    deliveryFee: 'Free Delivery',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWm7wDqgRuP2Bc8AtehA2JRMNXeJa4-OyFYnyMSwybg36dxBAnl5nZRxETNt-TLZCqo_VjSBtGAZBolhBrspL6QMLBWIvhhHHSnoZCKBg-Tro4A8Z6fKdL-F20PSny46iMZUznH2UFI5X_dhz0Ok6CybcEx8KFYbfK9-Fln-uKajpt6Sf6_y8aqGkGX_4DfHiD1lsIjo1FnI8oTCT964uuNg-MaOQyVbK9vnOJTSkwP48kmEVR0wtnnTTQUEaBnsXbELkOlrFYlJo',
  },
  {
    id: 'nonnas-oven',
    name: "Nonna's Oven",
    type: 'Pizza • Italian • Comfort',
    time: '30-45 min',
    rating: '4.9',
    deliveryFee: '$2.99 Fee',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBoAn2ZrT12OUWSeqx9xbPPjso3ZZJ1R_c2evaC6K2MbO8zcbF89c52-JhYCRSRFpN1ZrdAKnJPKFU8BZEjoVsR5V0IhQmgk6jU1UPGmQ_tW0QENTv1dUnhN9ktbhbg1YrBqYgDXm_avqGQRRQrS4RQr9FDEvJXCMumAqjKcMXSQDkT3KW3QXefYdw3_RGqmB-3NWsV_xhCnVKYOFfWYfQ-LR2J1zyhOmkOnha5MnEopNeqV412_y6Qwj_XgdaxC0WdiR3j9xOuRMs',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze Sushi',
    type: 'Sushi • Asian • Healthy',
    time: '40-55 min',
    rating: '4.6',
    deliveryFee: 'Free Delivery',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD_np2DY6sQBB3Unm5pDKVbiLIGyiC2UbZa8oVpXBBedVg5zQFfxQpDILWnfFaLpVSeor35SPyofu-sVpsovr34AqEe66R8GPuiSlCwAcRQkxIHcvnuSGePaHjsGq8nyY-CSHXosRcO-8awP6lUnQ-QgM8Ir4QiMn4i8JE0X9u-sgpjxo2fO_FWeeTSYO1IJbqdDK0oHYHxbeMw1yPZ5uNGAjM3BBPtd4JbuoAtNe7f9tAA6AzjB4-64RpKPGRcciTjx3ih6aMaOLM',
  },
]

const mockPopularDishes: PopularDish[] = [
  {
    id: 'crispy-spicy',
    name: 'Crispy Spicy Sandwich',
    restaurant: 'The Rustic Patty',
    price: '$12.50',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpWo9q4zILJj8vIweAf0sxQQ39oR_kXFBBIM_anADmRT9AbW909Ojsq4CsIgL3f-gdXKyoWD5eWx9tpOB4gDrgInklsoa96NTa_pinEk3d8LrcSjJehjno5wwgvmVLh6rZ6lIGx21PA-QxhGg979cn5s1Ddw_328R3YH5232B9zvRuEJWpSYaHtsZQh3dLztSO2RPiTxnhSgEIaUdbw8bCF4peJvWom-CUcO_ukHn0fHppq7jYwz4v02ToUxW-XbWMEUJQMMvLuUs',
  },
  {
    id: 'truffle-mac',
    name: 'Truffle Mac & Cheese',
    restaurant: "Nonna's Oven",
    price: '$9.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCq_wwXas8sQqCDLvn90kKBUlfIPu6VtQdlIIuEwS9shLoFz-W4JoBQvnNzhkzyaTyUyPsSTrreyFQUiEgxb9UXZAc35JqsukprCM6eZvOszKFyNq9Itvq_4fUofuxvVPRxoioT775n8W9uLVaMMaIWozfIueFAbR_xQMtu5ym06J-kk71OJg06lieZ5CP20QlbhmvOIwMcJ4aNtSIWeod9d1xOjIQdSQwRkO6FOVVyAYz51aKeyj9CkB3jJJSMC45te8z9rNfBpKM',
  },
  {
    id: 'matcha-boba',
    name: 'Iced Matcha Boba',
    restaurant: 'Zen Tea House',
    price: '$6.50',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ_oFE0scRUvVPHYfZnBdQo6hOeNuq2ZjzsYGuVWoyRUpcQE6yyt3uThRyelDw19LiiHgSDlS_0adjRWgp9vEe0gTeKOsQwCQfUYU23L-FPiQFK1HFWw3zmhJrCBRKz0_Hf4ahL0jQKnIbymJ-Z5zRHN5jXIrK8lIaxMSW5X3DGMf-P24bDpG-QTCMlu5LQN3eQw-RbAxRiUyq0trYkO_I9eC0UL2FzHfOk-9_39Cft16_PQ7a1NwvJPqoF24zMhPJriYI0_ARkt4',
  },
]

type UserFoodCatalogScreenProps = {
  onBackPress?: () => void
  onRestaurantPress?: () => void
  onAddDish?: (dishId: string) => void
}

export function UserFoodCatalogScreen({
  onBackPress,
  onRestaurantPress,
  onAddDish,
}: UserFoodCatalogScreenProps) {
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'nonnas-oven': true, // Make one favorited initially matching design
  })
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    '4.5+': true, // Init active matching design
  })

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [tag]: !prev[tag],
    }))
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Mobile Top Header (No Nav bar at bottom per instructions) */}
      <View style={styles.header}>
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
        >
          <Feather name="arrow-left" size={24} color="#191C1E" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text allowFontScaling={false} style={styles.headerTitle}>Food</Text>
          <Text allowFontScaling={false} style={styles.headerSubtitle}>Restaurants and meals near you</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}>
          <Ionicons name="options-outline" size={22} color="#a7391e" />
        </Pressable>
      </View>

      {/* Search Input bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color="#8b716b" />
          <TextInput
            allowFontScaling={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search restaurants or dishes"
            placeholderTextColor="rgba(88, 66, 60, 0.6)"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 64 }]}
      >
        {/* Category Chips horizontal scroll */}
        <View style={styles.sectionContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
          >
            {categories.map(cat => {
              const isActive = selectedCategory === cat
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* Premium Promo Banner Container (Coral/Orange Gradient mimicking circles) */}
        <View style={styles.promoBanner}>
          {/* Circular vector decorations to replicate rich light-mode premium aesthetic */}
          <View style={styles.promoCircleTop} />
          <View style={styles.promoCircleBottom} />

          <View style={styles.promoTextContainer}>
            <Text allowFontScaling={false} style={styles.promoTitle}>
              Free delivery on{'\n'}selected restaurants
            </Text>
            <Text allowFontScaling={false} style={styles.promoSubtitle}>
              Fresh meals delivered fast to your door.
            </Text>
          </View>

          <View style={styles.promoIconBubble}>
            <MaterialCommunityIcons name="truck-delivery" size={28} color="#ffffff" />
          </View>
        </View>

        {/* Filter Row Horizontal scroll */}
        <View style={styles.sectionContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTagsContainer}
          >
            {filterTags.map(tag => {
              const isActive = activeFilters[tag]
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleFilter(tag)}
                  style={[
                    styles.filterTag,
                    isActive && styles.filterTagActive,
                    tag === 'Sort' && styles.filterTagSort,
                  ]}
                >
                  {tag === 'Sort' && (
                    <MaterialCommunityIcons
                      name="sort-variant"
                      size={14}
                      color="#191C1E"
                      style={styles.filterTagSortIcon}
                    />
                  )}
                  {tag === '4.5+' && (
                    <Ionicons
                      name="star"
                      size={12}
                      color={isActive ? '#446744' : '#8b716b'}
                      style={styles.filterTagStarIcon}
                    />
                  )}
                  <Text
                    allowFontScaling={false}
                    style={[styles.filterTagText, isActive && styles.filterTagTextActive]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* Stack of Restaurants */}
        <View style={styles.restaurantsSection}>
          {mockRestaurants.map(restaurant => {
            const isFav = favorites[restaurant.id]
            return (
              <Pressable
                key={restaurant.id}
                onPress={onRestaurantPress}
                style={({ pressed }) => [styles.restaurantCard, pressed && styles.cardPressed]}
              >
                <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: restaurant.image }}
                    resizeMode="cover"
                    style={styles.cardImage}
                  />

                  {/* Favorite / Heart Button */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => toggleFavorite(restaurant.id)}
                    style={styles.favoriteButton}
                  >
                    <Ionicons
                      name={isFav ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFav ? '#a7391e' : '#191C1E'}
                    />
                  </Pressable>

                  {/* Time Badge Overlay */}
                  <View style={styles.timeBadge}>
                    <Text allowFontScaling={false} style={styles.timeBadgeText}>{restaurant.time}</Text>
                  </View>
                </View>

                {/* Card Details */}
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetailsTopRow}>
                    <Text allowFontScaling={false} style={styles.restaurantName} numberOfLines={1}>
                      {restaurant.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={13} color="#446744" />
                      <Text allowFontScaling={false} style={styles.ratingBadgeText}>{restaurant.rating}</Text>
                    </View>
                  </View>

                  <Text allowFontScaling={false} style={styles.restaurantTypes} numberOfLines={1}>
                    {restaurant.type}
                  </Text>

                  <View style={styles.deliveryInfoRow}>
                    <MaterialCommunityIcons
                      name="truck-delivery"
                      size={16}
                      color={restaurant.deliveryFee === 'Free Delivery' ? '#446744' : '#58423c'}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.deliveryFeeText,
                        restaurant.deliveryFee === 'Free Delivery' && styles.deliveryFeeFreeText,
                      ]}
                    >
                      {restaurant.deliveryFee}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Popular Dishes Horizontal Section */}
        <View style={styles.popularDishesSection}>
          <Text allowFontScaling={false} style={styles.popularDishesTitle}>Popular dishes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularDishesScroll}
          >
            {mockPopularDishes.map(dish => (
              <View key={dish.id} style={styles.dishCard}>
                <View style={styles.dishImageWrap}>
                  <Image
                    source={{ uri: dish.image }}
                    resizeMode="cover"
                    style={styles.dishImage}
                  />
                </View>

                <Text allowFontScaling={false} style={styles.dishName} numberOfLines={1}>
                  {dish.name}
                </Text>
                <Text allowFontScaling={false} style={styles.dishRestaurant} numberOfLines={1}>
                  {dish.restaurant}
                </Text>

                <View style={styles.dishFooter}>
                  <Text allowFontScaling={false} style={styles.dishPrice}>{dish.price}</Text>
                  <Pressable
                    onPress={() => onAddDish?.(dish.id)}
                    style={({ pressed }) => [styles.addDishBtn, pressed && styles.pressedOpacity]}
                  >
                    <Feather name="plus" size={18} color="#701500" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 227, 229, 0.4)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#a7391e',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#58423c',
    marginTop: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#191C1E',
    paddingVertical: 6,
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionContainer: {
    marginVertical: 6,
  },
  categoryChipsContainer: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 2,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.8)',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: '#ff7a59',
    borderColor: '#ff7a59',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#58423c',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  promoBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    backgroundColor: '#a7391e',
    minHeight: 124,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  promoCircleTop: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  promoCircleBottom: {
    position: 'absolute',
    right: 64,
    bottom: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  promoTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  promoIconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTagsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 2,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.8)',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTagActive: {
    borderColor: '#ff7a59',
    backgroundColor: 'rgba(255, 122, 89, 0.05)',
  },
  filterTagSort: {
    paddingLeft: 8,
  },
  filterTagSortIcon: {
    marginRight: 4,
  },
  filterTagStarIcon: {
    marginRight: 4,
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191C1E',
  },
  filterTagTextActive: {
    color: '#a7391e',
    fontWeight: '700',
  },
  restaurantsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },
  restaurantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.3)',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  cardImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#eceef0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191C1E',
  },
  cardDetails: {
    padding: 16,
    gap: 4,
  },
  cardDetailsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C1E',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191C1E',
  },
  restaurantTypes: {
    fontSize: 12,
    color: '#8b716b',
    fontWeight: '500',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  deliveryFeeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58423c',
  },
  deliveryFeeFreeText: {
    color: '#446744',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  popularDishesSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  popularDishesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C1E',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  popularDishesScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  dishCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.3)',
  },
  dishImageWrap: {
    height: 110,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eceef0',
    marginBottom: 8,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  dishRestaurant: {
    fontSize: 11,
    color: '#8b716b',
    fontWeight: '500',
    marginTop: 1,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1E',
  },
  addDishBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffdad2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
})
