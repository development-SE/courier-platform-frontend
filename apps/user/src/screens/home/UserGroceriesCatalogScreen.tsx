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

type Store = {
  id: string
  name: string
  type: string
  time: string
  rating: string
  deliveryFee: string
  image: string
}

const categories = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat']

const mockStores: Store[] = [
  {
    id: 'green-market',
    name: 'Green Market',
    type: 'Organic • Fresh Produce',
    time: '15-25 min',
    rating: '4.8',
    deliveryFee: '$1.49',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNYIti68I6cgVNwTS5D_1vyWm9VinUzG7W2wqhn918yPq-7kkQnwJrdWec2NLNwNxuv2m1oqbd1OY3EypSThQuqVkplyKZKjXUoR-VTMFazOMYIHIIcKdDppRlhJ_ELmGb7s-Gxzg6wUhoGgwGLyTHjES8SeGNfcD6VIIJrIJzINTDmTQZmIFdVdHMi4qBEvif_vaKP0IoAZa4V7vZjdrVw_AhwEI1eKxzHly0PrZLpxaDqECEHzKVdsM_yYouNaNzb6gLIo7vC9k',
  },
  {
    id: 'daily-essentials',
    name: 'Daily Essentials',
    type: 'Dairy • Bakery • Staples',
    time: '20-35 min',
    rating: '4.6',
    deliveryFee: 'Free',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCjNP9ejkHL9l8JMf08uF4wFH0wMOIIJWm4PDz3KbGwVoR3GQzgzpj7SCpo0CCTCEXkKZk2mCzo3rhMrpbT6K8zalxt6AcUCwLe4gWrNCFssjDbOOUJheW0oqhiZ-DkWIBMN2DSm2cFd4qCP6eLmmD4as_ceesHysob9NRyq65nJMothZRdG-n9zmryeaFhWZuOW6jS7QCZjvbrC8vhf5umA_36gf2PiAWmD-v6toN07OP__XD36jTMzXgl_GoJA_pRO5Fmsfo13tQ',
  },
]

type UserGroceriesCatalogScreenProps = {
  onBackPress?: () => void
  onStorePress?: () => void
}

export function UserGroceriesCatalogScreen({
  onBackPress,
  onStorePress,
}: UserGroceriesCatalogScreenProps) {
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Mobile Top AppBar */}
      <View style={styles.header}>
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
        >
          <Feather name="arrow-left" size={24} color="#191C1E" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text allowFontScaling={false} style={styles.headerTitle}>Groceries</Text>
          <Text allowFontScaling={false} style={styles.headerSubtitle}>Fresh products and daily essentials</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}>
          <Feather name="search" size={20} color="#191C1E" />
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
            placeholder="Search groceries or stores"
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

        {/* Premium Promo Banner Container (Light Green Gradient with Paper Bag Image overlay) */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <Text allowFontScaling={false} style={styles.promoTitle}>
              Fresh groceries{'\n'}delivered today
            </Text>
            <Text allowFontScaling={false} style={styles.promoSubtitle}>
              Save on fruits, dairy, and essentials
            </Text>
            <Pressable style={({ pressed }) => [styles.promoBtn, pressed && styles.pressedOpacity]}>
              <Text allowFontScaling={false} style={styles.promoBtnText}>Shop Now</Text>
            </Pressable>
          </View>

          {/* Paper Bag Image Placement with subtle mask overlay effect */}
          <View style={styles.promoImageContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4UyGbi9v_eTcE_joODNlFQMhF9goDXZhCxzio7KK7BB3__PU7WpfH-RbYyzZxgmiiPHluJ7WTyLbD5o6jdRu03gM4vpFVcUz8M7AK_1sEkBLXR8peFVn5FfP4ay5ICDkd1NQP71r26tkSNvsGlq6heodcX7Ws3dHMx5ztPfxAKwUb-EjPJ9h4vWJwl809lpeOqfHD9fmflMAFBo5uaiH2iQp7UOphw3L44r_bSA5pAlsOac7ZyJzQZ3HtXmndnHeLbFIiUB8OGF8',
              }}
              resizeMode="cover"
              style={styles.promoImage}
            />
          </View>
        </View>

        {/* Stores Section */}
        <View style={styles.storesSection}>
          <View style={styles.storesHeader}>
            <Text allowFontScaling={false} style={styles.storesTitle}>Top Stores</Text>
            <Pressable style={styles.seeAllBtn}>
              <Text allowFontScaling={false} style={styles.seeAllBtnText}>See all</Text>
              <Feather name="arrow-right" size={14} color="#a7391e" />
            </Pressable>
          </View>

          <View style={styles.storesList}>
            {mockStores.map(store => (
              <Pressable
                key={store.id}
                onPress={onStorePress}
                style={({ pressed }) => [styles.storeCard, pressed && styles.cardPressed]}
              >
                <Image
                  source={{ uri: store.image }}
                  resizeMode="cover"
                  style={styles.storeImage}
                />

                <View style={styles.storeDetails}>
                  <View style={styles.storeDetailsTopRow}>
                    <Text allowFontScaling={false} style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#446744" />
                      <Text allowFontScaling={false} style={styles.ratingText}>{store.rating}</Text>
                    </View>
                  </View>

                  <Text allowFontScaling={false} style={styles.storeType} numberOfLines={1}>
                    {store.type}
                  </Text>

                  <View style={styles.storeMetaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={12} color="#8b716b" />
                      <Text allowFontScaling={false} style={styles.metaText}>{store.time}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="truck-delivery" size={14} color="#8b716b" />
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.metaText,
                          store.deliveryFee === 'Free' && styles.metaFreeText,
                        ]}
                      >
                        {store.deliveryFee === 'Free' ? 'Free' : store.deliveryFee}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
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
    borderRadius: 12,
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
    backgroundColor: '#a7391e',
    borderColor: '#a7391e',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
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
    backgroundColor: '#c5edc1', // tertiary-fixed
    height: 140, // Fixed height to prevent high-res image stretching banner
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#446744',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#aad1a7', // tertiary-fixed-dim
  },
  promoTextContainer: {
    flex: 1.2,
    paddingLeft: 18,
    paddingVertical: 12,
    justifyContent: 'center',
    zIndex: 10,
  },
  promoTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#1e3f21', // on-tertiary-container
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 11,
    color: 'rgba(30, 63, 33, 0.8)',
    fontWeight: '600',
    marginBottom: 12,
  },
  promoBtn: {
    backgroundColor: '#446744', // tertiary
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  promoImageContainer: {
    flex: 0.8,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  storesSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  storesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  storesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C1E',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seeAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a7391e',
  },
  storesList: {
    gap: 12,
  },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.3)',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#eceef0',
  },
  storeDetails: {
    flex: 1,
    gap: 2,
  },
  storeDetailsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C1E',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191C1E',
  },
  storeType: {
    fontSize: 12,
    color: '#8b716b',
    fontWeight: '500',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#58423c',
  },
  metaFreeText: {
    color: '#446744',
    fontWeight: '800',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dfc0b8',
  },
  scrollView: {
    flex: 1,
  },
})
