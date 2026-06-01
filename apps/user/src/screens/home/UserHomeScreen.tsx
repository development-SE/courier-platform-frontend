import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const restaurants = [
  {
    name: 'The Artisan Crust',
    type: 'Italian',
    time: '20-30 min',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Green Market',
    type: 'Groceries',
    time: '30-40 min',
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Burger House',
    type: 'American',
    time: '15-25 min',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
  },
]

const categories = [
  {
    label: 'Food',
    color: 'rgba(255, 180, 162, 0.30)',
    iconColor: '#a7391e',
    icon: <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#a7391e" />,
  },
  {
    label: 'Groceries',
    color: 'rgba(174, 198, 255, 0.30)',
    iconColor: '#1e5bba',
    icon: <FontAwesome5 name="shopping-basket" size={17} color="#1e5bba" />,
  },
  {
    label: 'Pharmacy',
    color: 'rgba(170, 209, 167, 0.30)',
    iconColor: '#446744',
    icon: <FontAwesome5 name="briefcase-medical" size={17} color="#446744" />,
  },
  {
    label: 'Parcels',
    color: '#e0e3e5',
    iconColor: '#58423c',
    icon: <MaterialCommunityIcons name="archive" size={19} color="#58423c" />,
  },
]

const promoSlides = [
  {
    id: 'free-delivery',
    pill: 'PROMO',
    title: 'Free Delivery',
    subtitle: 'On your first 3 food orders.',
    image:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'groceries',
    pill: 'SAVE 25%',
    title: 'Fresh Groceries',
    subtitle: 'Discounts on fruit, vegetables, and pantry picks.',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'night-bites',
    pill: 'LATE NIGHT',
    title: 'Midnight Bites',
    subtitle: 'Open spots delivering until 2 AM.',
    image:
      'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=700&q=80',
  },
]

type UserHomeScreenProps = {
  onAddressPress?: () => void
  onNotificationsPress?: () => void
  unreadNotificationsCount?: number
  onOrdersPress?: () => void
  onCartPress?: () => void
  onProfilePress?: () => void
  onRestaurantPress?: () => void
  onSearchPress?: () => void
  onParcelsPress?: () => void
  onFoodPress?: () => void
  onGroceriesPress?: () => void
  onPharmacyPress?: () => void
  onSignOut?: () => void
}

export function UserHomeScreen({
  onAddressPress,
  onNotificationsPress,
  unreadNotificationsCount = 0,
  onOrdersPress,
  onCartPress,
  onProfilePress,
  onRestaurantPress,
  onSearchPress,
  onParcelsPress,
  onFoodPress,
  onGroceriesPress,
  onPharmacyPress,
}: UserHomeScreenProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [activePromoIndex, setActivePromoIndex] = useState(0)
  const promoScrollRef = useRef<ScrollView>(null)
  const promoCardWidth = width - 48
  const promoSnapInterval = promoCardWidth + 16

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActivePromoIndex(currentIndex => {
        const nextIndex = currentIndex === promoSlides.length - 1 ? 0 : currentIndex + 1

        promoScrollRef.current?.scrollTo({
          x: nextIndex * promoSnapInterval,
          animated: true,
        })

        return nextIndex
      })
    }, 3500)

    return () => clearInterval(intervalId)
  }, [promoSnapInterval])

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 108 + insets.bottom }]}
      >
        <View style={styles.header}>
          <Pressable onPress={onAddressPress}>
            <Text allowFontScaling={false} style={styles.deliveryLabel}>DELIVER TO</Text>
            <Text allowFontScaling={false} style={styles.address}>123 Maple St</Text>
          </Pressable>
          <Pressable onPress={onNotificationsPress} style={styles.bellButton}>
            <Feather name="bell" size={18} color="#191c1e" />
            {unreadNotificationsCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text allowFontScaling={false} style={styles.bellBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <Pressable onPress={onSearchPress} style={styles.searchBox}>
          <Feather name="search" size={18} color="#8b716b" />
          <Text allowFontScaling={false} style={styles.searchText}>Search food, groceries, or parcels</Text>
        </Pressable>

        <View style={styles.promoSection}>
          <ScrollView
            ref={promoScrollRef}
            horizontal
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            snapToInterval={promoSnapInterval}
            snapToAlignment="start"
            contentContainerStyle={styles.promoCarousel}
            onMomentumScrollEnd={event => {
              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / promoSnapInterval,
              )
              setActivePromoIndex(nextIndex)
            }}
          >
            {promoSlides.map(slide => (
              <View key={slide.id} style={[styles.promoCard, { width: promoCardWidth }]}>
                <ImageBackground
                  source={{ uri: slide.image }}
                  resizeMode="cover"
                  style={styles.promoImage}
                  imageStyle={styles.promoImageInner}
                >
                  <View style={styles.promoOverlay} />
                  <View style={styles.promoContent}>
                    <View style={styles.promoPill}>
                      <Text allowFontScaling={false} style={styles.promoPillText}>
                        {slide.pill}
                      </Text>
                    </View>
                    <View>
                      <Text allowFontScaling={false} style={styles.promoTitle}>
                        {slide.title}
                      </Text>
                      <Text allowFontScaling={false} style={styles.promoSubtitle}>
                        {slide.subtitle}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </ScrollView>

          <View style={styles.promoDots}>
            {promoSlides.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.promoDot, index === activePromoIndex && styles.promoDotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>All Categories</Text>
          <View style={styles.categoriesRow}>
            {categories.map(category => (
              <Pressable
                key={category.label}
                style={styles.categoryItem}
                onPress={
                  category.label === 'Parcels'
                    ? onParcelsPress
                    : category.label === 'Food'
                    ? onFoodPress
                    : category.label === 'Groceries'
                    ? onGroceriesPress
                    : category.label === 'Pharmacy'
                    ? onPharmacyPress
                    : undefined
                }
              >
                <View style={[styles.categoryIconBox, { backgroundColor: category.color }]}>
                  {category.icon}
                </View>
                <Text allowFontScaling={false} style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.orderHeader}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Order again</Text>
          <Text allowFontScaling={false} style={styles.seeAll}>See all</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {restaurants.map(item => (
            <Pressable key={item.name} onPress={onRestaurantPress} style={styles.restaurantCard}>
              <View style={styles.restaurantImageWrap}>
                <Image source={{ uri: item.image }} resizeMode="cover" style={styles.restaurantImage} />
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color="#446744" />
                  <Text allowFontScaling={false} style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.cardMetaRow}>
                <Text allowFontScaling={false} style={styles.cardMeta}>{item.type}</Text>
                <View style={styles.metaDot} />
                <Feather name="clock" size={12} color="#8b716b" />
                <Text allowFontScaling={false} style={styles.cardMeta}>{item.time}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <TabItem active icon={<Ionicons name="home" size={20} color="#ffffff" />} label="Home" />
        <Pressable onPress={onOrdersPress}>
          <TabItem icon={<Feather name="box" size={20} color="#191c1e" />} label="Orders" />
        </Pressable>
        <Pressable onPress={onCartPress}>
          <TabItem icon={<Feather name="shopping-cart" size={20} color="#191c1e" />} label="Cart" />
        </Pressable>
        <Pressable onPress={onProfilePress}>
          <TabItem icon={<Feather name="user" size={20} color="#191c1e" />} label="Profile" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function TabItem({ active, icon, label }: { active?: boolean; icon: ReactNode; label: string }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconBox, active && styles.tabIconActive]}>{icon}</View>
      <Text allowFontScaling={false} style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 24,
  },
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryLabel: {
    color: '#8b716b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  address: {
    color: '#191c1e',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#A7391E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  searchBox: {
    height: 56,
    borderRadius: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#e6e8ea',
  },
  searchText: {
    flex: 1,
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '400',
  },
  promoCard: {
    height: 256,
    marginRight: 16,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#ffdad2',
  },
  promoSection: {
    gap: 14,
  },
  promoCarousel: {
    paddingRight: 8,
  },
  promoImage: {
    flex: 1,
  },
  promoImageInner: {
    opacity: 0.22,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(216, 226, 255, 0.38)',
  },
  promoContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  promoPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
  },
  promoPillText: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    fontWeight: '800',
  },
  promoTitle: {
    color: '#191c1e',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
  },
  promoSubtitle: {
    color: 'rgba(25, 28, 30, 0.80)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  promoDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d8dadc',
  },
  promoDotActive: {
    width: 24,
    backgroundColor: '#a7391e',
  },
  section: {
    gap: 24,
  },
  sectionTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  categoryIconBox: {
    alignSelf: 'stretch',
    height: 62,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    color: '#a7391e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  cardsRow: {
    paddingRight: 24,
    gap: 20,
  },
  restaurantCard: {
    width: 240,
    height: 222,
    padding: 12,
    borderRadius: 32,
    gap: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 1,
  },
  restaurantImageWrap: {
    height: 140,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f2f4f6',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  ratingPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
  },
  ratingText: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMeta: {
    color: '#8b716b',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8dadc',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    width: 70,
    alignItems: 'center',
    gap: 3,
  },
  tabIconBox: {
    width: 38,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: '#a7391e',
  },
  tabLabel: {
    color: '#191c1e',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#a7391e',
    fontWeight: '800',
  },
})
