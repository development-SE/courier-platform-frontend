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

type Pharmacy = {
  id: string
  name: string
  type: string
  time: string
  rating: string
  deliveryFee: string
  image: string
}

type Product = {
  id: string
  name: string
  store: string
  price: string
  originalPrice?: string
  image: string
}

const categories = ['All', 'Vitamins', 'Cold & Flu', 'Pain Relief', 'First Aid']

const filterTags = ['Sort', 'Open now', 'Fast delivery', 'Top Rated']

const mockPharmacies: Pharmacy[] = [
  {
    id: 'wellness-pharmacy',
    name: 'Wellness Pharmacy Plus',
    type: 'Medicine • Health products • Personal Care',
    time: '20-40 min',
    rating: '4.8',
    deliveryFee: '$2.99',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAouPPZLAjrmrENp0qllHtA6fAB2DFr8vwueM0255gkY691_l7BCzduJliyF3ZwuFA6JGhmSe_QHYwK39kVd9YpGUguyLw0dgfKDCmcu7r6gRLXO7FuEDjj8I4mFMZymwzOi-zcnGHh3p_ZtP9WpT5xoc_Ykm42W-jvK82DPlCdD7omcpwGJxY6mNomfhXa_gfodIsL8CYH3ykf04N9Azlh56F8LevAHQ9cOdyl0dmJbZhQMBWRibr2UHVZk5_a-LP3LgzS6l8cNsU',
  },
  {
    id: 'city-health',
    name: 'City Health Center',
    type: 'Vitamins • First Aid • Baby Care',
    time: '15-30 min',
    rating: '4.6',
    deliveryFee: 'Free',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrXX8KgsJVEi-1n0NUnYkz0nfZtbigS30DI9MUiwDp4ecvlgbuH0fWaqYtwNGgTJZKUZkpsqB_49oxiG0OKF91nhBwuAFFSUE3cq8_XUF-JRA2x4jbEMFLYegvUTTJw9Po1z08Q3bIFv4EZRekFXgmb1wkuuPpWT2qnd2RR--gaMNLSApFY-5tUbFYqOKPQ0RjrA0yGjEsEE39sjU9A_RAgdi6L7mlG9QhK6hKTSQvAjdcl5ABPYSx3p2TqXRkLt4GxVEU5kj0YMA',
  },
]

const mockProducts: Product[] = [
  {
    id: 'vitamin-c',
    name: 'Daily Vitamin C 1000mg',
    store: 'Wellness Pharmacy',
    price: '$12.99',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC7o-Ep8JMIyajCxcxPxnCRpD_DDwPBQvp83vO-PsotHN-gznlDRrfWRr1P-oQgtNPRYlUrlQFFXqlL2RMOu7X18siFPxNsLU0Wqict4Jv4BjiXaic9rkyBqKfhnyVeSqPo9mbbzx4r3pI3ua-yTPsEw6ubT2CIyVhFYxuStDC3TkjNHu9T-TqA1Gf2rhR2MfnaQgtD0GUTyua9c6AlDWV56NjEnFa5QCcxtGOLb6ewqkLcieUy-lUmPrnnOxzuINrI5ntR88dO-Ps',
  },
  {
    id: 'bandages',
    name: 'Fabric Bandages 40ct',
    store: 'City Health Center',
    price: '$4.25',
    originalPrice: '$5.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBLiRWVbDl5f-vksfsMUN5h2dLsxU7kBTQffjX48QPIvb134TYn007zrYhcnxZAuAWXpoFPDXXnP6eoRFIs6j59gzLGAuNmjSod7Ut_ubGQVieBv-cZzwUf0VTR-7epw8qc1tA7fH7HIBPM15RbT2n4Z2kF1Gl2EFnju1Secy69FBGpNYsDiY0HDUy-ekLyPkpYn2yfIG7ib46mN06TFLVtN8sUNfjdOZgyiycLWriADVdUPCXXZwT4QR2_CwKVPImzKOjPqRkqKQQ',
  },
  {
    id: 'thermometer',
    name: 'Digital Thermometer',
    store: 'Wellness Pharmacy',
    price: '$18.50',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmgEi4BGJhWXilTRF6jjRdg1ZHEmVs4HPZ_kq6ktdvvKNvJjBFS7Bj4b2-YIuSdk1Ckunl5MfS_fR35OLTE6N2NbTm3jQpy4HyfOko2sH9liIcsMef6kcG1h2l-JlBKrRGQOfmw4EmAeXqjsWTJoBSHElMa4rjemymOAz6G0gRuE9bTVLiHuEdo2i16D3Lhubl7QlO1Uk6FtWA7cv00dT7CtdDmNZYleqX1-JHNNmednw8mXKp_b92OoqgDKihO55V5FFXDK6BDr4',
  },
]

type UserPharmacyCatalogScreenProps = {
  onBackPress?: () => void
  onStorePress?: () => void
  onAddProduct?: (productId: string) => void
}

export function UserPharmacyCatalogScreen({
  onBackPress,
  onStorePress,
  onAddProduct,
}: UserPharmacyCatalogScreenProps) {
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    'Open now': true, // Init active matching design
  })

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [tag]: !prev[tag],
    }))
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* Mobile Top AppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}
          >
            <Feather name="arrow-left" size={24} color="#a7391e" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text allowFontScaling={false} style={styles.headerTitle}>Pharmacy</Text>
            <Text allowFontScaling={false} style={styles.headerSubtitle}>Medicine and health products near you</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}>
            <Feather name="search" size={22} color="#a7391e" />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressedOpacity]}>
            <Ionicons name="options-outline" size={22} color="#a7391e" />
          </Pressable>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 64 }]}
      >
        {/* Search Input bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#8b716b" />
            <TextInput
              allowFontScaling={false}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search medicine or pharmacy"
              placeholderTextColor="rgba(88, 66, 60, 0.6)"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Safety Note banner */}
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#1e5bba" style={styles.safetyIcon} />
          <Text allowFontScaling={false} style={styles.safetyText}>
            Please check product instructions before use. Consult a pharmacist if unsure.
          </Text>
        </View>

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

        {/* Premium Promo Banner Container (Fixed height to prevent asset stretching) */}
        <View style={styles.promoBanner}>
          {/* Unsplash beautiful hospital asset styled behind as overlay */}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1584308666744-24d5e4a5db22?auto=format&fit=crop&q=80&w=800',
            }}
            resizeMode="cover"
            style={styles.promoBgImage}
          />
          <View style={styles.promoImageMask} />

          <View style={styles.promoTextContainer}>
            <Text allowFontScaling={false} style={styles.promoTitle}>
              Health essentials{'\n'}delivered fast.
            </Text>
            <Text allowFontScaling={false} style={styles.promoSubtitle}>
              Under 30 minutes.
            </Text>
            <Pressable style={({ pressed }) => [styles.promoBtn, pressed && styles.pressedOpacity]}>
              <Text allowFontScaling={false} style={styles.promoBtnText}>Shop Now</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters tag row */}
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
                  {tag === 'Fast delivery' && (
                    <MaterialCommunityIcons
                      name="flash"
                      size={13}
                      color={isActive ? '#1e5bba' : '#191C1E'}
                      style={styles.filterTagFlashIcon}
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

        {/* Pharmacies Section */}
        <View style={styles.pharmaciesSection}>
          <View style={styles.pharmaciesHeader}>
            <Text allowFontScaling={false} style={styles.pharmaciesTitle}>Nearby Pharmacies</Text>
            <Pressable style={styles.seeAllBtn}>
              <Text allowFontScaling={false} style={styles.seeAllBtnText}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.pharmaciesList}>
            {mockPharmacies.map(pharmacy => (
              <Pressable
                key={pharmacy.id}
                onPress={onStorePress}
                style={({ pressed }) => [styles.pharmacyCard, pressed && styles.cardPressed]}
              >
                <View style={styles.pharmacyImageWrap}>
                  <Image
                    source={{ uri: pharmacy.image }}
                    resizeMode="cover"
                    style={styles.pharmacyImage}
                  />

                  {/* Open now Live Badge */}
                  <View style={styles.openNowBadge}>
                    <View style={styles.openIndicatorDot} />
                    <Text allowFontScaling={false} style={styles.openBadgeText}>Open now</Text>
                  </View>
                </View>

                <View style={styles.pharmacyDetails}>
                  <View style={styles.pharmacyTopRow}>
                    <Text allowFontScaling={false} style={styles.pharmacyName} numberOfLines={1}>
                      {pharmacy.name}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#a7391e" style={styles.ratingBadgeIcon} />
                      <Text allowFontScaling={false} style={styles.ratingText}>{pharmacy.rating}</Text>
                    </View>
                  </View>

                  <Text allowFontScaling={false} style={styles.pharmacyType} numberOfLines={1}>
                    {pharmacy.type}
                  </Text>

                  <View style={styles.pharmacyMetaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={13} color="#1e5bba" />
                      <Text allowFontScaling={false} style={styles.metaText}>{pharmacy.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="bike-fast" size={15} color="#1e5bba" />
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.metaText,
                          pharmacy.deliveryFee === 'Free' && styles.metaFreeText,
                        ]}
                      >
                        {pharmacy.deliveryFee === 'Free' ? 'Free' : pharmacy.deliveryFee}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Popular Products Horizontal section */}
        <View style={styles.productsSection}>
          <Text allowFontScaling={false} style={styles.productsTitle}>Popular Products</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {mockProducts.map(product => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImageWrap}>
                  {product.originalPrice && (
                    <View style={styles.saleBadge}>
                      <Text allowFontScaling={false} style={styles.saleBadgeText}>-15%</Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: product.image }}
                    resizeMode="contain"
                    style={styles.productImage}
                  />
                </View>

                <View style={styles.productMeta}>
                  <Text allowFontScaling={false} style={styles.productStore} numberOfLines={1}>
                    {product.store}
                  </Text>
                  <Text allowFontScaling={false} style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  <View style={styles.productFooter}>
                    <View style={styles.priceContainer}>
                      <Text allowFontScaling={false} style={styles.productPrice}>{product.price}</Text>
                      {product.originalPrice && (
                        <Text allowFontScaling={false} style={styles.productOriginalPrice}>
                          {product.originalPrice}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => onAddProduct?.(product.id)}
                      style={({ pressed }) => [styles.addProductBtn, pressed && styles.pressedOpacity]}
                    >
                      <Feather name="plus" size={18} color="#a7391e" />
                    </Pressable>
                  </View>
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
  scrollView: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#a7391e',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#58423c',
    marginTop: 1,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
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
  safetyBanner: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(174, 198, 255, 0.25)', // light blue matching secondary-fixed
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#003275',
  },
  scrollContent: {
    paddingTop: 4,
  },
  sectionContainer: {
    marginVertical: 8,
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
    backgroundColor: '#6b9cff', // secondary-container
    borderColor: '#6b9cff',
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
    height: 140, // Fixed height to prevent stretching
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    backgroundColor: '#aec6ff', // secondary-fixed-dim
  },
  promoBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  promoImageMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(174, 198, 255, 0.2)',
  },
  promoTextContainer: {
    flex: 1,
    paddingLeft: 18,
    justifyContent: 'center',
    zIndex: 10,
  },
  promoTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: '#003275', // on-secondary-container
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 11,
    color: 'rgba(0, 50, 117, 0.8)',
    fontWeight: '700',
    marginBottom: 12,
  },
  promoBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  promoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191c1e',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterTagsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 2,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
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
    borderColor: '#6b9cff',
    backgroundColor: 'rgba(107, 156, 255, 0.05)',
  },
  filterTagSort: {
    paddingLeft: 10,
  },
  filterTagSortIcon: {
    marginRight: 4,
  },
  filterTagFlashIcon: {
    marginRight: 2,
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191C1E',
  },
  filterTagTextActive: {
    color: '#1e5bba',
    fontWeight: '700',
  },
  pharmaciesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 14,
  },
  pharmaciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pharmaciesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C1E',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  seeAllBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#a7391e',
  },
  pharmaciesList: {
    gap: 16,
  },
  pharmacyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(224, 227, 229, 0.3)',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  pharmacyImageWrap: {
    height: 156,
    width: '100%',
    position: 'relative',
    backgroundColor: '#eceef0',
  },
  pharmacyImage: {
    width: '100%',
    height: '100%',
  },
  openNowBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#446744', // tertiary green
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  pharmacyDetails: {
    padding: 16,
    gap: 4,
  },
  pharmacyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pharmacyName: {
    fontSize: 17,
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
    borderRadius: 10,
    gap: 4,
  },
  ratingBadgeIcon: {
    marginTop: -1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#191C1E',
  },
  pharmacyType: {
    fontSize: 12,
    color: '#8b716b',
    fontWeight: '500',
  },
  pharmacyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#191C1E',
  },
  metaFreeText: {
    color: '#446744',
  },
  productsSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C1E',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productsScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  productCard: {
    width: 160,
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
  productImageWrap: {
    height: 120,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eceef0',
    marginBottom: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  saleBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ffdad6', // error-container
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  saleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ba1a1a', // error
  },
  productMeta: {
    gap: 2,
  },
  productStore: {
    fontSize: 10,
    color: '#8b716b',
    fontWeight: '600',
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#191C1E',
    height: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191C1E',
  },
  productOriginalPrice: {
    fontSize: 10,
    color: '#8b716b',
    textDecorationLine: 'line-through',
    marginTop: -1,
  },
  addProductBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(167, 57, 30, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
