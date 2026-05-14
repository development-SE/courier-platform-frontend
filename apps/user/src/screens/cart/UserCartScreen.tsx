import { useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type CartItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  quantity: number
}

type UserCartScreenProps = {
  restaurantName?: string
  items: CartItem[]
  onHomePress?: () => void
  onGoToCatalog?: () => void
  onGoToPayment?: () => void
  onDecreaseItem?: (itemId: string) => void
  onIncreaseItem?: (itemId: string) => void
}

const freeDeliveryTarget = 41

const merchantChips = ['The Artisan Crust', 'Fresh Market', 'Local Cafe']

const suggestedAddOns = [
  {
    id: 'garlic-knots',
    name: 'Garlic Knots',
    price: 6,
    image:
      'https://images.unsplash.com/photo-1619531038896-8f623cd6a33f?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'artisan-cola',
    name: 'Artisan Cola',
    price: 4.5,
    image:
      'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 'fudge-brownie',
    name: 'Fudge Brownie',
    price: 5,
    image:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=320&q=80',
  },
]

export function UserCartScreen({
  restaurantName = 'The Artisan Crust',
  items,
  onHomePress,
  onGoToCatalog,
  onGoToPayment,
  onDecreaseItem,
  onIncreaseItem,
}: UserCartScreenProps) {
  const insets = useSafeAreaInsets()
  const [utensilsRequested, setUtensilsRequested] = useState(false)

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )
  const deliveryFee = items.length > 0 ? 2.99 : 0
  const taxesAndFees = items.length > 0 ? 3.84 : 0
  const total = subtotal + deliveryFee + taxesAndFees
  const cartItemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items],
  )
  const freeDeliveryRemaining = Math.max(freeDeliveryTarget - subtotal, 0)
  const freeDeliveryProgress = Math.min(subtotal / freeDeliveryTarget, 1)
  const isEmpty = items.length === 0

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onHomePress} style={styles.headerIconButton}>
          <Feather name="arrow-left" size={18} color="#191c1e" />
        </Pressable>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          Your Cart
        </Text>

        <View style={styles.headerIconButton}>
          <Feather name="more-vertical" size={18} color="#191c1e" />
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyOrb}>
            <MaterialCommunityIcons name="cart-outline" size={42} color="#ff7a59" />
          </View>

          <Text allowFontScaling={false} style={styles.emptyTitle}>
            Your cart is empty
          </Text>
          <Text allowFontScaling={false} style={styles.emptySubtitle}>
            Choose items from the menu and they will appear here.
          </Text>

          <Pressable onPress={onGoToCatalog} style={styles.emptyButton}>
            <Text allowFontScaling={false} style={styles.emptyButtonText}>
              Go to catalog
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 96 + Math.max(insets.bottom, 16) },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {merchantChips.map((chip, index) => {
                const isActive = chip === restaurantName || index === 0

                return (
                  <View
                    key={chip}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {chip}
                    </Text>
                    {isActive ? (
                      <View style={styles.chipCount}>
                        <Text allowFontScaling={false} style={styles.chipCountText}>
                          {cartItemCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </ScrollView>

            <View style={styles.freeDeliveryCard}>
              <View style={styles.freeDeliveryHeader}>
                <View>
                  <Text allowFontScaling={false} style={styles.freeDeliveryTitle}>
                    Almost there!
                  </Text>
                  <Text allowFontScaling={false} style={styles.freeDeliverySubtitle}>
                    {freeDeliveryRemaining > 0
                      ? `Add $${freeDeliveryRemaining.toFixed(2)} more for free delivery`
                      : 'You unlocked free delivery'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="truck-delivery-outline" size={18} color="#446744" />
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(8, freeDeliveryProgress * 100)}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.itemsList}>
              {items.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: item.image }} resizeMode="cover" style={styles.itemImage} />

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemCopy}>
                        <Text allowFontScaling={false} style={styles.itemTitle}>
                          {item.name}
                        </Text>
                        <Text allowFontScaling={false} style={styles.itemDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <Text allowFontScaling={false} style={styles.itemPrice}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.itemFooter}>
                      <Pressable onPress={onGoToCatalog}>
                        <Text allowFontScaling={false} style={styles.editText}>
                          Edit
                        </Text>
                      </Pressable>

                      <View style={styles.quantityPill}>
                        <Pressable
                          onPress={() => onDecreaseItem?.(item.id)}
                          style={styles.quantityButton}
                        >
                          <Feather name="minus" size={14} color="#191c1e" />
                        </Pressable>

                        <Text allowFontScaling={false} style={styles.quantityText}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          onPress={() => onIncreaseItem?.(item.id)}
                          style={styles.quantityButton}
                        >
                          <Feather name="plus" size={14} color="#191c1e" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <Pressable onPress={onGoToCatalog} style={styles.openMenuButton}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#191c1e" />
                <Text allowFontScaling={false} style={styles.openMenuText}>
                  Go to catalog
                </Text>
              </Pressable>
            </View>

            <View style={styles.optionsCard}>
              <View style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#58423c" />
                  </View>

                  <View>
                    <Text allowFontScaling={false} style={styles.optionTitle}>
                      Request utensils
                    </Text>
                    <Text allowFontScaling={false} style={styles.optionSubtitle}>
                      Help reduce waste
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setUtensilsRequested(current => !current)}
                  style={[
                    styles.toggleTrack,
                    utensilsRequested && styles.toggleTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      utensilsRequested && styles.toggleThumbActive,
                    ]}
                  />
                </Pressable>
              </View>

              <Pressable style={styles.instructionsRow}>
                <View style={styles.instructionsLeft}>
                  <MaterialCommunityIcons name="text-box-outline" size={18} color="#58423c" />
                  <Text allowFontScaling={false} style={styles.instructionsTitle}>
                    Instructions for restaurant
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#58423c" />
              </Pressable>
            </View>

            <View style={styles.addOnsSection}>
              <Text allowFontScaling={false} style={styles.sectionTitle}>
                Anything else?
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.addOnsRow}
              >
                {suggestedAddOns.map(addOn => (
                  <View key={addOn.id} style={styles.addOnCard}>
                    <Image source={{ uri: addOn.image }} resizeMode="cover" style={styles.addOnImage} />

                    <View style={styles.addOnBody}>
                      <View style={styles.addOnCopy}>
                        <Text allowFontScaling={false} numberOfLines={1} style={styles.addOnTitle}>
                          {addOn.name}
                        </Text>
                        <Text allowFontScaling={false} style={styles.addOnPrice}>
                          ${addOn.price.toFixed(2)}
                        </Text>
                      </View>

                      <Pressable onPress={onGoToCatalog} style={styles.addOnButton}>
                        <Feather name="plus" size={15} color="#191c1e" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>
                  Subtotal
                </Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  ${subtotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>
                  Delivery Fee
                </Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  ${deliveryFee.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>
                  Taxes & Fees
                </Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  ${taxesAndFees.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text allowFontScaling={false} style={styles.totalLabel}>
                  Total
                </Text>
                <Text allowFontScaling={false} style={styles.totalValue}>
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable onPress={onGoToPayment} style={styles.checkoutButton}>
              <Text allowFontScaling={false} style={styles.checkoutButtonText}>
                Go to payment
              </Text>
              <Feather name="arrow-right" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </>
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  chipsRow: {
    paddingRight: 16,
    gap: 12,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipActive: {
    backgroundColor: '#ff7a59',
    shadowColor: '#ff7a59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: '#e0e3e5',
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipTextActive: {
    color: '#701500',
    fontWeight: '600',
  },
  chipTextInactive: {
    color: '#58423c',
    fontWeight: '500',
  },
  chipCount: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  chipCountText: {
    color: '#a7391e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  freeDeliveryCard: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 1,
  },
  freeDeliveryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  freeDeliveryTitle: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  freeDeliverySubtitle: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#e6e8ea',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#446744',
  },
  itemsList: {
    gap: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 24,
    elevation: 1,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e6e8ea',
  },
  itemContent: {
    flex: 1,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCopy: {
    flex: 1,
  },
  itemTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  itemDescription: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 2,
  },
  itemPrice: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  itemFooter: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editText: {
    color: '#a7391e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  quantityPill: {
    padding: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6e8ea',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  quantityText: {
    minWidth: 16,
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  openMenuButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e6e8ea',
  },
  openMenuText: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  optionsCard: {
    padding: 16,
    borderRadius: 32,
    gap: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 24,
    elevation: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  optionTitle: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: '#e0e3e5',
  },
  toggleTrackActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.32)',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toggleThumbActive: {
    marginLeft: 22,
    borderColor: '#ff7a59',
  },
  instructionsRow: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
  },
  instructionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionsTitle: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  addOnsSection: {
    gap: 16,
  },
  sectionTitle: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  addOnsRow: {
    paddingRight: 16,
    gap: 16,
  },
  addOnCard: {
    width: 144,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 1,
  },
  addOnImage: {
    width: '100%',
    height: 96,
    backgroundColor: '#e6e8ea',
  },
  addOnBody: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 12,
    gap: 12,
  },
  addOnCopy: {
    gap: 4,
  },
  addOnTitle: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  addOnPrice: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  addOnButton: {
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 32,
    gap: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 24,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  summaryValue: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e6e8ea',
  },
  totalLabel: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  totalValue: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
  },
  checkoutButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 90,
  },
  emptyOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 5,
  },
  emptyTitle: {
    marginTop: 28,
    color: '#191c1e',
    fontSize: 28,
    lineHeight: 35,
    textAlign: 'center',
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 10,
    color: '#58423c',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
  },
  emptyButton: {
    marginTop: 24,
    height: 56,
    minWidth: 180,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
})
