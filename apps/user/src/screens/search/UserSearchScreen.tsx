import { useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const categories = [
  {
    label: 'FOOD',
    bg: 'rgba(255, 122, 89, 0.10)',
    icon: <MaterialCommunityIcons name="silverware-fork-knife" size={23} color="#a7391e" />,
  },
  {
    label: 'GROCERIES',
    bg: 'rgba(107, 156, 255, 0.10)',
    icon: <FontAwesome5 name="shopping-cart" size={20} color="#1e5bba" />,
  },
  {
    label: 'PHARMACY',
    bg: 'rgba(133, 171, 132, 0.10)',
    icon: <FontAwesome5 name="briefcase-medical" size={20} color="#446744" />,
  },
  {
    label: 'PARCELS',
    bg: 'rgba(255, 218, 210, 0.30)',
    icon: <Feather name="package" size={22} color="#862208" />,
  },
]

const popularSearches = [
  { label: 'Sushi', bg: 'rgba(255, 122, 89, 0.10)', color: '#a7391e', icon: 'trending-up' as const },
  { label: 'Groceries', bg: 'rgba(107, 156, 255, 0.10)', color: '#1e5bba' },
  { label: 'Send parcel', bg: 'rgba(133, 171, 132, 0.10)', color: '#446744', icon: 'corner-up-right' as const },
  { label: 'Flower delivery', bg: '#e6e8ea', color: '#58423c' },
]

const recentSearches = ['Pizza', 'Burger King', 'Pharmacy']

type UserSearchScreenProps = {
  onCancelPress?: () => void
}

export function UserSearchScreen({ onCancelPress }: UserSearchScreenProps) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const filteredRecentSearches = useMemo(() => {
    if (!normalizedQuery) {
      return recentSearches
    }

    return recentSearches.filter(item => item.toLowerCase().includes(normalizedQuery))
  }, [normalizedQuery])

  const filteredPopularSearches = useMemo(() => {
    if (!normalizedQuery) {
      return popularSearches
    }

    return popularSearches.filter(item => item.label.toLowerCase().includes(normalizedQuery))
  }, [normalizedQuery])

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrap}>
          <Feather name="search" size={18} color="#a7391e" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search"
            placeholderTextColor="#8b716b"
            allowFontScaling={false}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
              <Feather name="x" size={15} color="#8b716b" />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onCancelPress}>
          <Text allowFontScaling={false} style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 132 + insets.bottom }]}
      >
        <View style={styles.categoriesRow}>
          {categories.map(category => (
            <View key={category.label} style={styles.categoryItem}>
              <View style={[styles.categoryCircle, { backgroundColor: category.bg }]}>
                {category.icon}
              </View>
              <Text allowFontScaling={false} style={styles.categoryLabel}>{category.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Popular searches</Text>
          <View style={styles.chipsWrap}>
            {filteredPopularSearches.length > 0 ? (
              filteredPopularSearches.map(item => (
                <Pressable key={item.label} style={[styles.chip, { backgroundColor: item.bg }]}>
                  {item.icon ? <Feather name={item.icon} size={12} color={item.color} /> : null}
                  <Text allowFontScaling={false} style={[styles.chipText, { color: item.color }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyInline}>
                <Feather name="search" size={14} color="#8b716b" />
                <Text allowFontScaling={false} style={styles.emptyInlineText}>No popular matches</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Recent searches</Text>
            <Text allowFontScaling={false} style={styles.clearAll}>CLEAR ALL</Text>
          </View>
          <View style={styles.recentList}>
            {filteredRecentSearches.map(item => (
              <Pressable key={item} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <Feather name="clock" size={18} color="#94a3b8" />
                  <Text allowFontScaling={false} style={styles.recentText}>{item}</Text>
                </View>
                <Feather name="arrow-up-left" size={15} color="#cbd5e1" />
              </Pressable>
            ))}
            {filteredRecentSearches.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="search" size={19} color="#a7391e" />
                </View>
                <View style={styles.emptyCopy}>
                  <Text allowFontScaling={false} style={styles.emptyTitle}>Nothing found</Text>
                  <Text allowFontScaling={false} style={styles.emptySubtitle}>
                    Try food, groceries, pharmacy, or parcels.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.serviceOverlay} />
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=420&q=80',
            }}
            resizeMode="cover"
            style={styles.serviceImage}
          />
          <View style={styles.serviceContent}>
            <View style={styles.servicePill}>
              <Text allowFontScaling={false} style={styles.servicePillText}>NEW SERVICE</Text>
            </View>
            <Text allowFontScaling={false} style={styles.serviceTitle}>
              Same-day{'\n'}laundry is now{'\n'}live.
            </Text>
            <Text allowFontScaling={false} style={styles.serviceSubtitle}>Free delivery on first order.</Text>
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
  searchHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f7f9fb',
  },
  searchInputWrap: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#ff7a59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    color: '#191c1e',
    fontSize: 16,
    fontWeight: '500',
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelText: {
    color: '#a7391e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 24,
    gap: 40,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: '#58423c',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  clearAll: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  emptyInline: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e6e8ea',
  },
  emptyInlineText: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recentText: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  emptyState: {
    minHeight: 92,
    padding: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f2f4f6',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 122, 89, 0.10)',
  },
  emptyCopy: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  serviceCard: {
    height: 192,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#ff7a59',
  },
  serviceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(167, 57, 30, 0.18)',
    zIndex: 1,
  },
  serviceImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '52%',
    height: '100%',
    opacity: 0.86,
  },
  serviceContent: {
    position: 'relative',
    zIndex: 2,
    width: '62%',
    height: '100%',
    padding: 24,
    justifyContent: 'center',
  },
  servicePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    marginBottom: 8,
  },
  servicePillText: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    fontWeight: '800',
  },
  serviceTitle: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  serviceSubtitle: {
    color: 'rgba(255, 255, 255, 0.80)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
})
